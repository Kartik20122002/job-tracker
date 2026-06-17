import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { refreshAccessToken, searchGmailMessages, getGmailMessage, GmailApiError } from "@/lib/gmail";
import { matchEmailToApp, buildMaps } from "@/app/api/gmail/sync/route";
import { isProUser } from "@/lib/pro-access";
import { isFilteredSender } from "@/config/emailFilters";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isProUser(session.user.email ?? ""))) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { applicationId } = await request.json();
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const { data: application } = await supabaseAdmin
    .from("Application")
    .select("id, company, position, recruiterEmail")
    .eq("id", applicationId)
    .eq("userId", session.user.id)
    .single();

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const { data: connection } = await supabaseAdmin
    .from("GmailConnection")
    .select("accessToken, refreshToken")
    .eq("userId", session.user.id)
    .single();

  if (!connection) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const query = application.recruiterEmail?.trim()
    ? `from:${application.recruiterEmail.trim()} newer_than:30d`
    : `${application.company.trim()} newer_than:30d`;

  try {
    const accessToken = await refreshAccessToken(connection.refreshToken);
    await supabaseAdmin
      .from("GmailConnection")
      .update({ accessToken })
      .eq("userId", session.user.id);

    const stubs = await searchGmailMessages(accessToken, query, 50);
    const maps = buildMaps([application]);

    const results = await Promise.all(
      stubs.map(async (stub) => {
        const parsed = await getGmailMessage(accessToken, stub.id);
        if (!parsed) return null;
        if (isFilteredSender(parsed.senderEmail)) return null;
        const match = matchEmailToApp(parsed, maps);
        if (!match) return null;
        return {
          applicationId,
          gmailMessageId: stub.id,
          gmailThreadId: stub.threadId,
          sender: parsed.sender,
          senderEmail: parsed.senderEmail,
          subject: parsed.subject,
          snippet: parsed.snippet,
          receivedAt: parsed.receivedAt.toISOString(),
          matchedBy: match.matchedBy,
        };
      })
    );

    const toCreate = results.filter((r): r is NonNullable<typeof r> => r !== null);

    let newCount = 0;
    if (toCreate.length > 0) {
      const { data: inserted } = await supabaseAdmin
        .from("EmailActivity")
        .upsert(toCreate, { onConflict: "gmailMessageId", ignoreDuplicates: true })
        .select("id");
      newCount = inserted?.length ?? 0;
    }

    return NextResponse.json({ newCount, query });
  } catch (err) {
    if (err instanceof GmailApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Fetch failed. Please try again." }, { status: 500 });
  }
}
