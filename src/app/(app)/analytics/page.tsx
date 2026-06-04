import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ApplicationsByCountry,
  ApplicationsByMonth,
  ApplicationsBySource,
  ApplicationsByStatus,
} from "@/features/analytics/components/AnalyticsCharts";
import { getAnalyticsData } from "@/server/queries/analytics";

export default async function AnalyticsPage() {
  const session = await auth();
  const data = await getAnalyticsData(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights into your job search
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.metrics.responseRate}%</p>
            <p className="text-xs text-muted-foreground">Got a response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.metrics.interviewRate}%</p>
            <p className="text-xs text-muted-foreground">Reached interview stage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.metrics.offerRate}%</p>
            <p className="text-xs text-muted-foreground">Received an offer</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data yet.</p>
            ) : (
              <ApplicationsByMonth data={data.byMonth} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Country</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byCountry.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data yet.</p>
            ) : (
              <ApplicationsByCountry data={data.byCountry} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data yet.</p>
            ) : (
              <ApplicationsByStatus data={data.byStatus} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data yet.</p>
            ) : (
              <ApplicationsBySource data={data.bySource} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
