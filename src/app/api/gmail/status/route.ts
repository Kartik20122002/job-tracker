import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [connection, lastSync, runningSync] = await Promise.all([
    prisma.gmailConnection.findUnique({
      where: { userId: session.user.id },
      select: { gmailAddress: true, connectedAt: true },
    }),
    prisma.gmailSync.findFirst({
      where: { userId: session.user.id, status: "SUCCESS" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, emailsScanned: true, emailsMatched: true },
    }),
    prisma.gmailSync.findFirst({
      where: { userId: session.user.id, status: "RUNNING" },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    }),
  ]);

  return NextResponse.json({
    isConnected: !!connection,
    gmailAddress: connection?.gmailAddress ?? null,
    connectedAt: connection?.connectedAt ?? null,
    lastSync: lastSync
      ? {
          completedAt: lastSync.completedAt,
          emailsScanned: lastSync.emailsScanned,
          emailsMatched: lastSync.emailsMatched,
        }
      : null,
    isSyncing: !!runningSync,
  });
}
