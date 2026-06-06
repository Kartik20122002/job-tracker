import { supabaseAdmin } from "@/lib/supabase";
import { ApplicationSource, ApplicationStatus } from "@/lib/enums";
import type { ApplicationWithHistory } from "@/types/database";

export { ApplicationSource, ApplicationStatus };
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

  let query = supabaseAdmin
    .from("Application")
    .select("*", { count: "exact" })
    .eq("userId", userId);

  if (search) {
    query = query.or(`company.ilike.%${search}%,position.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status);
  if (country) query = query.ilike("country", `%${country}%`);
  if (source) query = query.eq("source", source);

  const ascending = sort === "oldest";
  const column = sort === "company" ? "company" : "appliedDate";
  query = query.order(column, { ascending });

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: applications, count, error } = await query;

  if (error) throw error;

  return { applications: applications ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE };
}

export async function getApplicationById(
  id: string,
  userId: string
): Promise<ApplicationWithHistory | null> {
  const { data, error } = await supabaseAdmin
    .from("Application")
    .select("*, StatusHistory(*)")
    .eq("id", id)
    .eq("userId", userId)
    .single();

  if (error || !data) return null;

  const statusHistory = ((data as Record<string, unknown>).StatusHistory as ApplicationWithHistory["statusHistory"] ?? [])
    .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());

  const { StatusHistory: _, ...app } = data as typeof data & { StatusHistory: unknown };

  return { ...(app as Omit<ApplicationWithHistory, "statusHistory">), statusHistory };
}

export async function getDashboardData(userId: string) {
  const [{ data: allApps }, { data: recentApplications }, { data: upcomingInterviews }] =
    await Promise.all([
      supabaseAdmin
        .from("Application")
        .select("status")
        .eq("userId", userId),
      supabaseAdmin
        .from("Application")
        .select("*")
        .eq("userId", userId)
        .order("appliedDate", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("Application")
        .select("*")
        .eq("userId", userId)
        .gte("nextInterviewDate", new Date().toISOString())
        .order("nextInterviewDate", { ascending: true })
        .limit(5),
    ]);

  // Aggregate status counts in JS
  const countMap = new Map<string, number>();
  for (const { status } of allApps ?? []) {
    countMap.set(status, (countMap.get(status) ?? 0) + 1);
  }
  const statusCounts = Array.from(countMap.entries()).map(([status, count]) => ({ status: status as ApplicationStatus, count }));

  const inactiveStatuses = new Set<ApplicationStatus>([
    ApplicationStatus.Started,
    ApplicationStatus.Referral_Asked,
    ApplicationStatus.Rejected,
    ApplicationStatus.Withdrawn,
    ApplicationStatus.Accepted,
  ]);
  const rejectedStatuses = new Set<ApplicationStatus>([ApplicationStatus.Rejected, ApplicationStatus.Withdrawn]);
  const offerStatuses = new Set<ApplicationStatus>([ApplicationStatus.Offer_Received, ApplicationStatus.Accepted]);

  const total = statusCounts.reduce((s, x) => s + x.count, 0);
  const active = statusCounts.filter((x) => !inactiveStatuses.has(x.status as ApplicationStatus)).reduce((s, x) => s + x.count, 0);
  const rejected = statusCounts.filter((x) => rejectedStatuses.has(x.status as ApplicationStatus)).reduce((s, x) => s + x.count, 0);
  const offers = statusCounts.filter((x) => offerStatuses.has(x.status as ApplicationStatus)).reduce((s, x) => s + x.count, 0);

  return {
    summary: { total, active, rejected, offers },
    statusCounts,
    recentApplications: recentApplications ?? [],
    upcomingInterviews: upcomingInterviews ?? [],
  };
}
