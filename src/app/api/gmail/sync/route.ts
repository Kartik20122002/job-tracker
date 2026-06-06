import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { refreshAccessToken, searchGmailMessages, getGmailMessage, GmailApiError } from "@/lib/gmail";
import { ApplicationStatus } from "@/lib/enums";
import type { MatchedByValue } from "@/lib/gmail-matcher";
import type { ParsedEmail } from "@/lib/gmail";

const INACTIVE_STATUSES = [ApplicationStatus.Rejected, ApplicationStatus.Withdrawn];

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

function buildQueries(maps: AppMaps): string[] {
  const queries: string[] = [];

  const emails = Array.from(maps.byEmail.keys());
  for (let i = 0; i < emails.length; i += 5) {
    const batch = emails.slice(i, i + 5);
    const q =
      batch.length === 1
        ? `from:${batch[0]} newer_than:30d`
        : `(${batch.map((e) => `from:${e}`).join(" OR ")}) newer_than:30d`;
    queries.push(q);
  }

  queries.push(
    `(interview OR "job offer" OR shortlisted OR "move forward" OR regret OR "application status" OR congratulations OR selected) newer_than:30d`
  );

  return queries;
}

export function matchEmailToApp(
  email: ParsedEmail,
  maps: AppMaps
): { app: AppInfo; score: number; matchedBy: MatchedByValue } | null {
  const exact = maps.byEmail.get(email.senderEmail);
  if (exact) return { app: exact, score: 100, matchedBy: "RECRUITER_EMAIL" };

  const domain = email.senderEmail.split("@")[1]?.toLowerCase();
  if (domain) {
    const apps = maps.byDomain.get(domain);
    if (apps?.length) return { app: apps[0], score: 80, matchedBy: "RECRUITER_DOMAIN" };
  }

  const subject = email.subject.toLowerCase();
  const snippet = email.snippet.toLowerCase();

  for (const [company, apps] of maps.byCompany) {
    if (subject.includes(company)) return { app: apps[0], score: 70, matchedBy: "COMPANY_SUBJECT" };
  }
  for (const [company, apps] of maps.byCompany) {
    if (snippet.includes(company)) return { app: apps[0], score: 60, matchedBy: "COMPANY_SNIPPET" };
  }
  for (const [position, apps] of maps.byPosition) {
    if (subject.includes(position)) return { app: apps[0], score: 50, matchedBy: "POSITION_TITLE" };
  }

  return null;
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const { data: connection } = await supabaseAdmin
    .from("GmailConnection")
    .select("accessToken, refreshToken")
    .eq("userId", userId)
    .single();

  if (!connection) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const { data: recentRunning } = await supabaseAdmin
    .from("GmailSync")
    .select("id")
    .eq("userId", userId)
    .eq("status", "RUNNING")
    .gte("startedAt", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(1)
    .single();

  if (recentRunning) return NextResponse.json({ error: "Sync already in progress" }, { status: 409 });

  const { data: syncRecord } = await supabaseAdmin
    .from("GmailSync")
    .insert({ userId, status: "RUNNING" })
    .select("id")
    .single();

  if (!syncRecord) return NextResponse.json({ error: "Failed to start sync" }, { status: 500 });

  const startTime = Date.now();

  const failSync = async () => {
    await supabaseAdmin
      .from("GmailSync")
      .update({ status: "FAILED", completedAt: new Date().toISOString() })
      .eq("id", syncRecord.id);
  };

  try {
    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(connection.refreshToken);
      await supabaseAdmin
        .from("GmailConnection")
        .update({ accessToken })
        .eq("userId", userId);
    } catch {
      await failSync();
      return NextResponse.json(
        { error: "Gmail access was revoked. Please reconnect Gmail in Settings." },
        { status: 401 }
      );
    }

    const { data: applications } = await supabaseAdmin
      .from("Application")
      .select("id, company, position, recruiterEmail")
      .eq("userId", userId)
      .neq("status", ApplicationStatus.Rejected)
      .neq("status", ApplicationStatus.Withdrawn);

    if (!applications?.length) {
      await supabaseAdmin
        .from("GmailSync")
        .update({ status: "SUCCESS", completedAt: new Date().toISOString(), emailsScanned: 0, emailsMatched: 0 })
        .eq("id", syncRecord.id);
      return NextResponse.json({ status: "SUCCESS", emailsScanned: 0, emailsMatched: 0, duration: Date.now() - startTime });
    }

    const maps = buildMaps(applications);
    const queries = buildQueries(maps);

    const LIST_BATCH = 50;
    const allStubs = new Map<string, string>();

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

    const allIds = Array.from(allStubs.keys());
    const { data: alreadySynced } = await supabaseAdmin
      .from("EmailActivity")
      .select("gmailMessageId")
      .in("gmailMessageId", allIds);

    const syncedSet = new Set((alreadySynced ?? []).map((e) => e.gmailMessageId));
    const newStubs = allIds.filter((id) => !syncedSet.has(id));

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
        receivedAt: c.parsed.receivedAt.toISOString(),
        matchedBy: c.matchedBy,
      }));

      const { data: inserted } = await supabaseAdmin
        .from("EmailActivity")
        .upsert(toCreate, { onConflict: "gmailMessageId", ignoreDuplicates: true })
        .select("id");

      emailsMatched = inserted?.length ?? 0;
    }

    const emailsScanned = newStubs.length;

    await supabaseAdmin
      .from("GmailSync")
      .update({ status: "SUCCESS", completedAt: new Date().toISOString(), emailsScanned, emailsMatched })
      .eq("id", syncRecord.id);

    return NextResponse.json({ status: "SUCCESS", emailsScanned, emailsMatched, duration: Date.now() - startTime });
  } catch (err) {
    await failSync();
    return NextResponse.json(
      { error: err instanceof GmailApiError ? err.message : "Sync failed. Please try again." },
      { status: 500 }
    );
  }
}
