import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refreshAccessToken, searchGmailMessages, getGmailMessage, GmailApiError } from "@/lib/gmail";
import { matchEmailToApp, buildMaps } from "@/app/api/gmail/sync/route";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await request.json();
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: session.user.id },
    select: { id: true, company: true, position: true, recruiterEmail: true },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const connection = await prisma.gmailConnection.findUnique({ where: { userId: session.user.id } });
  if (!connection) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const query = application.recruiterEmail?.trim()
    ? `from:${application.recruiterEmail.trim()} newer_than:30d`
    : `${application.company.trim()} newer_than:30d`;

  try {
    const accessToken = await refreshAccessToken(connection.refreshToken);
    await prisma.gmailConnection.update({ where: { userId: session.user.id }, data: { accessToken } });

    const stubs = await searchGmailMessages(accessToken, query, 50);
    const maps = buildMaps([application]);

    // Fetch all message details in parallel
    const results = await Promise.all(
      stubs.map(async (stub) => {
        const parsed = await getGmailMessage(accessToken, stub.id);
        if (!parsed) return null;
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
          receivedAt: parsed.receivedAt,
          matchedBy: match.matchedBy,
        };
      })
    );

    const toCreate = results.filter((r): r is NonNullable<typeof r> => r !== null);

    let newCount = 0;
    if (toCreate.length > 0) {
      const result = await prisma.emailActivity.createMany({ data: toCreate, skipDuplicates: true });
      newCount = result.count;
    }

    return NextResponse.json({ newCount, query });
  } catch (err) {
    if (err instanceof GmailApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Fetch failed. Please try again." }, { status: 500 });
  }
}
