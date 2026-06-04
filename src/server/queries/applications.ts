import { prisma } from "@/lib/db";
import { ApplicationSource, ApplicationStatus } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 20;

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus;
  country?: string;
  source?: ApplicationSource;
  sort?: "newest" | "oldest" | "company";
  page?: number;
}

export async function getApplications(userId: string, filters: ApplicationFilters = {}) {
  const { search, status, country, source, sort = "newest", page = 1 } = filters;

  const where: Prisma.ApplicationWhereInput = { userId };

  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { position: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (country) where.country = { contains: country, mode: "insensitive" };
  if (source) where.source = source;

  const orderBy: Prisma.ApplicationOrderByWithRelationInput =
    sort === "oldest"
      ? { appliedDate: "asc" }
      : sort === "company"
      ? { company: "asc" }
      : { appliedDate: "desc" };

  const skip = (page - 1) * PAGE_SIZE;

  const [applications, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total, page, pageSize: PAGE_SIZE };
}

export async function getApplicationById(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: {
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });
}

export async function getDashboardData(userId: string) {
  const [statusCounts, recentApplications, upcomingInterviews] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.application.findMany({
      where: { userId },
      orderBy: { appliedDate: "desc" },
      take: 5,
    }),
    prisma.application.findMany({
      where: {
        userId,
        nextInterviewDate: { gte: new Date() },
      },
      orderBy: { nextInterviewDate: "asc" },
      take: 5,
    }),
  ]);

  const total = statusCounts.reduce((sum, s) => sum + s._count, 0);
  const inactiveStatuses = new Set<string>([
    ApplicationStatus.Rejected,
    ApplicationStatus.Withdrawn,
    ApplicationStatus.Accepted,
  ]);
  const active = statusCounts
    .filter((s) => !inactiveStatuses.has(s.status))
    .reduce((sum, s) => sum + s._count, 0);
  const rejectedStatuses = new Set<string>([
    ApplicationStatus.Rejected,
    ApplicationStatus.Withdrawn,
  ]);
  const rejected = statusCounts
    .filter((s) => rejectedStatuses.has(s.status))
    .reduce((sum, s) => sum + s._count, 0);
  const offerStatuses = new Set<string>([
    ApplicationStatus.Offer_Received,
    ApplicationStatus.Accepted,
  ]);
  const offers = statusCounts
    .filter((s) => offerStatuses.has(s.status))
    .reduce((sum, s) => sum + s._count, 0);

  return {
    summary: { total, active, rejected, offers },
    statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count })),
    recentApplications,
    upcomingInterviews,
  };
}
