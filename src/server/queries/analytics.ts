import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { ApplicationStatus } from "@/generated/prisma/client";

export async function getAnalyticsData(userId: string) {
  const [applications, statusCounts, sourceCounts, countryCounts] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      select: { appliedDate: true, status: true },
      orderBy: { appliedDate: "asc" },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.application.groupBy({
      by: ["source"],
      where: { userId },
      _count: true,
    }),
    prisma.application.groupBy({
      by: ["country"],
      where: { userId },
      _count: true,
      orderBy: { _count: { country: "desc" } },
    }),
  ]);

  const monthMap = new Map<string, number>();
  for (const app of applications) {
    const key = format(new Date(app.appliedDate), "MMM yyyy");
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const byMonth = Array.from(monthMap.entries()).map(([month, count]) => ({
    month,
    count,
  }));

  const total = applications.length;
  const interviewedSet = new Set<string>([
    ApplicationStatus.Technical_Round_1,
    ApplicationStatus.Technical_Round_2,
    ApplicationStatus.Technical_Round_3,
    ApplicationStatus.Managerial_Round,
    ApplicationStatus.HR_Round,
    ApplicationStatus.Offer_Received,
    ApplicationStatus.Accepted,
  ]);
  const offerSet = new Set<string>([
    ApplicationStatus.Offer_Received,
    ApplicationStatus.Accepted,
  ]);
  const totalResponded = applications.filter(
    (a) => a.status !== ApplicationStatus.Applied
  ).length;
  const totalInterviewed = applications.filter((a) => interviewedSet.has(a.status)).length;
  const totalOffers = applications.filter((a) => offerSet.has(a.status)).length;

  return {
    byMonth,
    byStatus: statusCounts.map((s) => ({ status: s.status, count: s._count })),
    bySource: sourceCounts.map((s) => ({ source: s.source, count: s._count })),
    byCountry: countryCounts
      .slice(0, 10)
      .map((c) => ({ country: c.country, count: c._count })),
    metrics: {
      total,
      responseRate: total > 0 ? Math.round((totalResponded / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((totalInterviewed / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((totalOffers / total) * 100) : 0,
    },
  };
}
