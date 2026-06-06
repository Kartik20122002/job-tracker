import { format } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase";
import { ApplicationStatus } from "@/lib/enums";

export async function getAnalyticsData(userId: string) {
  const { data: applications } = await supabaseAdmin
    .from("Application")
    .select("appliedDate, status")
    .eq("userId", userId)
    .order("appliedDate", { ascending: true });

  const apps = applications ?? [];

  // Group by month
  const monthMap = new Map<string, number>();
  for (const app of apps) {
    const key = format(new Date(app.appliedDate), "MMM yyyy");
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const byMonth = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));

  // Group by status in JS
  const statusMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const countryMap = new Map<string, number>();

  // Need full data for source/country aggregation
  const { data: fullApps } = await supabaseAdmin
    .from("Application")
    .select("status, source, country")
    .eq("userId", userId);

  for (const app of fullApps ?? []) {
    statusMap.set(app.status, (statusMap.get(app.status) ?? 0) + 1);
    sourceMap.set(app.source, (sourceMap.get(app.source) ?? 0) + 1);
    countryMap.set(app.country, (countryMap.get(app.country) ?? 0) + 1);
  }

  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
  const bySource = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }));
  const byCountry = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const interviewedSet = new Set([
    ApplicationStatus.Technical_Round_1,
    ApplicationStatus.Technical_Round_2,
    ApplicationStatus.Technical_Round_3,
    ApplicationStatus.Managerial_Round,
    ApplicationStatus.HR_Round,
    ApplicationStatus.Offer_Received,
    ApplicationStatus.Accepted,
  ]);
  const offerSet = new Set([ApplicationStatus.Offer_Received, ApplicationStatus.Accepted]);

  const total = apps.length;
  const totalResponded = apps.filter((a) => a.status !== ApplicationStatus.Applied).length;
  const totalInterviewed = apps.filter((a) => interviewedSet.has(a.status as ApplicationStatus)).length;
  const totalOffers = apps.filter((a) => offerSet.has(a.status as ApplicationStatus)).length;

  return {
    byMonth,
    byStatus,
    bySource,
    byCountry,
    metrics: {
      total,
      responseRate: total > 0 ? Math.round((totalResponded / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((totalInterviewed / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((totalOffers / total) * 100) : 0,
    },
  };
}
