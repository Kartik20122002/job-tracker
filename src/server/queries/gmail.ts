import { prisma } from "@/lib/db";

export async function getGmailConnectionStatus(userId: string) {
  const [connection, lastSync, runningSync] = await Promise.all([
    prisma.gmailConnection.findUnique({
      where: { userId },
      select: { gmailAddress: true, connectedAt: true },
    }),
    prisma.gmailSync.findFirst({
      where: { userId, status: "SUCCESS" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, emailsScanned: true, emailsMatched: true },
    }),
    prisma.gmailSync.findFirst({
      where: { userId, status: "RUNNING" },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    }),
  ]);

  return {
    isConnected: !!connection,
    gmailAddress: connection?.gmailAddress ?? null,
    connectedAt: connection?.connectedAt ?? null,
    lastSync: lastSync ?? null,
    isSyncing: !!runningSync,
  };
}

export async function getRecentEmailActivities(userId: string, limit = 5) {
  return prisma.emailActivity.findMany({
    where: { application: { userId } },
    orderBy: { receivedAt: "desc" },
    take: limit,
    include: {
      application: { select: { company: true, id: true } },
    },
  });
}

export async function getTotalMatchedEmails(userId: string) {
  return prisma.emailActivity.count({
    where: { application: { userId } },
  });
}

export async function getEmailActivitiesForApplication(applicationId: string) {
  return prisma.emailActivity.findMany({
    where: { applicationId },
    orderBy: { receivedAt: "desc" },
  });
}

export async function getEmailActivityById(id: string, userId: string) {
  return prisma.emailActivity.findFirst({
    where: { id, application: { userId } },
    include: {
      application: { select: { id: true, company: true, position: true } },
    },
  });
}
