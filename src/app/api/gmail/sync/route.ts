import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refreshAccessToken, searchGmailMessages, getGmailMessage, GmailApiError } from "@/lib/gmail";
import type { MatchedByValue } from "@/lib/gmail-matcher";
import type { ParsedEmail } from "@/lib/gmail";
import { ApplicationStatus } from "@/generated/prisma/client";

const INACTIVE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
];

// ─── Application lookup maps ──────────────────────────────────────────────────

type AppInfo = { id: string; company: string; position: string; recruiterEmail: string | null };
type AppMaps = {
  byEmail: Map<string, AppInfo>;
  byDomain: Map<string, AppInfo[]>;
  byCompany: Map<string, AppInfo[]>;
  byPosition: Map<string, AppInfo[]>;
};

export function buildMaps(apps: AppInfo[]): AppMaps {
  const byEmail = new Map<string, AppInfo>();
  const byDomain = new Map<string, AppInfo[]>();
  const byCompany = new Map<string, AppInfo[]>();
  const byPosition = new Map<string, AppInfo[]>();

  for (const app of apps) {
    const email = app.recruiterEmail?.toLowerCase().trim();
    if (email) {
      byEmail.set(email, app);
      const domain = email.split("@")[1];
      if (domain) {
        const arr = byDomain.get(domain) ?? [];
        arr.push(app);
        byDomain.set(domain, arr);
      }
    }
    const company = app.company.toLowerCase().trim();
    if (company.length >= 2) {
      const arr = byCompany.get(company) ?? [];
      arr.push(app);
      byCompany.set(company, arr);
    }
    const position = app.position.toLowerCase().trim();
    if (position.length >= 3) {
      const arr = byPosition.get(position) ?? [];
      arr.push(app);
      byPosition.set(position, arr);
    }
  }

  return { byEmail, byDomain, byCompany, byPosition };
}

// ─── Batched Gmail queries ────────────────────────────────────────────────────
// Strategy: recruiter email batches (precision) + 1 keyword query (broad coverage).
// Company name queries removed — too noisy and covered by keyword + domain matching.
// All list queries run in parallel: 41 queries × 5 units = 205 units/sec < 250 limit.

function buildQueries(maps: AppMaps): string[] {
  const queries: string[] = [];

  // Recruiter emails batched 5 per query — exact sender matching
  const emails = Array.from(maps.byEmail.keys());
  for (let i = 0; i < emails.length; i += 5) {
    const batch = emails.slice(i, i + 5);
    const q =
      batch.length === 1
        ? `from:${batch[0]} newer_than:30d`
        : `(${batch.map((e) => `from:${e}`).join(" OR ")}) newer_than:30d`;
    queries.push(q);
  }

  // Broad recruitment keyword query — catches emails without exact sender match
  queries.push(
    `(interview OR "job offer" OR shortlisted OR "move forward" OR regret OR "application status" OR congratulations OR selected) newer_than:30d`
  );

  return queries;
}

// ─── O(1) matching using maps ─────────────────────────────────────────────────

export function matchEmailToApp(
  email: ParsedEmail,
  maps: AppMaps
): { app: AppInfo; score: number; matchedBy: MatchedByValue } | null {
  // Rule 1: exact recruiter email
  const exact = maps.byEmail.get(email.senderEmail);
  if (exact) return { app: exact, score: 100, matchedBy: "RECRUITER_EMAIL" };

  // Rule 2: sender domain matches a recruiter's domain
  const domain = email.senderEmail.split("@")[1]?.toLowerCase();
  if (domain) {
    const apps = maps.byDomain.get(domain);
    if (apps?.length) return { app: apps[0], score: 80, matchedBy: "RECRUITER_DOMAIN" };
  }

  const subject = email.subject.toLowerCase();
  const snippet = email.snippet.toLowerCase();

  // Rule 3: company name in subject
  for (const [company, apps] of maps.byCompany) {
    if (subject.includes(company)) return { app: apps[0], score: 70, matchedBy: "COMPANY_SUBJECT" };
  }

  // Rule 4: company name in snippet
  for (const [company, apps] of maps.byCompany) {
    if (snippet.includes(company)) return { app: apps[0], score: 60, matchedBy: "COMPANY_SNIPPET" };
  }

  // Rule 5: position title in subject
  for (const [position, apps] of maps.byPosition) {
    if (subject.includes(position)) return { app: apps[0], score: 50, matchedBy: "POSITION_TITLE" };
  }

  return null;
}

// ─── Sync handler ─────────────────────────────────────────────────────────────

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!connection) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const recentRunning = await prisma.gmailSync.findFirst({
    where: { userId, status: "RUNNING", startedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
  });
  if (recentRunning) return NextResponse.json({ error: "Sync already in progress" }, { status: 409 });

  const syncRecord = await prisma.gmailSync.create({ data: { userId, status: "RUNNING" } });
  const startTime = Date.now();

  try {
    // Refresh token
    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(connection.refreshToken);
      await prisma.gmailConnection.update({ where: { userId }, data: { accessToken } });
    } catch {
      await prisma.gmailSync.update({ where: { id: syncRecord.id }, data: { status: "FAILED", completedAt: new Date() } });
      return NextResponse.json({ error: "Gmail access was revoked. Please reconnect Gmail in Settings." }, { status: 401 });
    }

    // Load active applications and build maps
    const applications = await prisma.application.findMany({
      where: { userId, status: { notIn: INACTIVE_STATUSES } },
      select: { id: true, company: true, position: true, recruiterEmail: true },
    });

    if (applications.length === 0) {
      await prisma.gmailSync.update({ where: { id: syncRecord.id }, data: { status: "SUCCESS", completedAt: new Date(), emailsScanned: 0, emailsMatched: 0 } });
      return NextResponse.json({ status: "SUCCESS", emailsScanned: 0, emailsMatched: 0, duration: Date.now() - startTime });
    }

    const maps = buildMaps(applications);
    const queries = buildQueries(maps);

    console.log(`[Gmail Sync] ${applications.length} apps → ${queries.length} queries (batched ${LIST_BATCH}/round)`);

    // Run list queries in batches of 50 — 50 × 5 = 250 units/round, exactly at the per-user limit.
    // Full parallel would exceed 250/sec for 500+ apps and trigger silent 429 coverage gaps.
    const LIST_BATCH = 50;
    const allStubs = new Map<string, string>(); // messageId → threadId

    for (let i = 0; i < queries.length; i += LIST_BATCH) {
      const round = queries.slice(i, i + LIST_BATCH);
      const roundResults = await Promise.all(
        round.map(async (query) => {
          try {
            return await searchGmailMessages(accessToken, query, 50);
          } catch (e) {
            if (e instanceof GmailApiError && e.statusCode === 401) throw e;
            return [];
          }
        })
      );
      for (const stubs of roundResults) {
        for (const s of stubs) {
          if (!allStubs.has(s.id)) allStubs.set(s.id, s.threadId);
        }
      }
    }

    console.log(`[Gmail Sync] ${allStubs.size} unique stubs after dedup`);

    // Skip stubs already in DB — avoid redundant messages.get calls
    const allIds = Array.from(allStubs.keys());
    const alreadySynced = await prisma.emailActivity.findMany({
      where: { gmailMessageId: { in: allIds } },
      select: { gmailMessageId: true },
    });
    const syncedSet = new Set(alreadySynced.map((e) => e.gmailMessageId));
    const newStubs = allIds.filter((id) => !syncedSet.has(id));

    console.log(`[Gmail Sync] ${newStubs.length} new stubs to fetch (${syncedSet.size} already in DB)`);

    // Fetch new message details in parallel batches of 10
    // 10 × 20 quota units = 200 units/sec — safely under the 250/sec per-user limit
    const BATCH = 10;
    type Candidate = { applicationId: string; threadId: string; score: number; matchedBy: MatchedByValue; parsed: ParsedEmail };
    const candidates = new Map<string, Candidate>();

    for (let i = 0; i < newStubs.length; i += BATCH) {
      const batch = newStubs.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (messageId) => {
          const threadId = allStubs.get(messageId)!;
          const parsed = await getGmailMessage(accessToken, messageId);
          if (!parsed) return;

          const match = matchEmailToApp(parsed, maps);
          if (!match) return;

          const existing = candidates.get(messageId);
          if (!existing || match.score > existing.score) {
            candidates.set(messageId, { applicationId: match.app.id, threadId, score: match.score, matchedBy: match.matchedBy, parsed });
          }
        })
      );
    }

    // Insert matched emails
    let emailsMatched = 0;
    if (candidates.size > 0) {
      const toCreate = Array.from(candidates.entries()).map(([messageId, c]) => ({
        applicationId: c.applicationId,
        gmailMessageId: messageId,
        gmailThreadId: c.threadId,
        sender: c.parsed.sender,
        senderEmail: c.parsed.senderEmail,
        subject: c.parsed.subject,
        snippet: c.parsed.snippet,
        receivedAt: c.parsed.receivedAt,
        matchedBy: c.matchedBy,
      }));

      const result = await prisma.emailActivity.createMany({ data: toCreate, skipDuplicates: true });
      emailsMatched = result.count;
    }

    const emailsScanned = newStubs.length;

    await prisma.gmailSync.update({
      where: { id: syncRecord.id },
      data: { status: "SUCCESS", completedAt: new Date(), emailsScanned, emailsMatched },
    });

    console.log(`[Gmail Sync] done — scanned=${emailsScanned} matched=${emailsMatched} ms=${Date.now() - startTime}`);
    return NextResponse.json({ status: "SUCCESS", emailsScanned, emailsMatched, duration: Date.now() - startTime });
  } catch (err) {
    await prisma.gmailSync.update({ where: { id: syncRecord.id }, data: { status: "FAILED", completedAt: new Date() } });
    return NextResponse.json({ error: err instanceof GmailApiError ? err.message : "Sync failed. Please try again." }, { status: 500 });
  }
}
