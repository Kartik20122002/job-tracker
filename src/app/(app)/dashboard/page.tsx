import Link from "next/link";
import { BarChart3, Briefcase, CheckCircle, Plus, TrendingUp, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusBreakdownChart } from "@/features/dashboard/components/StatusBreakdownChart";
import { RecruiterUpdatesWidget } from "@/features/gmail/components/RecruiterUpdatesWidget";
import { getDashboardData } from "@/server/queries/applications";
import { getGmailConnectionStatus, getRecentEmailActivities, getTotalMatchedEmails } from "@/server/queries/gmail";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Application } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [
    { summary, statusCounts, recentApplications, upcomingInterviews },
    gmail,
    recentEmails,
    totalMatched,
  ] = await Promise.all([
    getDashboardData(userId),
    getGmailConnectionStatus(userId),
    getRecentEmailActivities(userId, 5),
    getTotalMatchedEmails(userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/applications/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Link>
          <Link
            href="/analytics"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.active}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected or withdrawn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.offers}</p>
            <p className="text-xs text-muted-foreground">Received or accepted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Applications */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <Link
              href="/applications"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentApplications.map((app: Application) => (
                  <li key={app.id}>
                    <Link
                      href={`/applications/${app.id}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{app.company}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatDate(app.appliedDate)}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBreakdownChart data={statusCounts} />
          </CardContent>
        </Card>

        {/* Recruiter Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recruiter Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <RecruiterUpdatesWidget
              isConnected={gmail.isConnected}
              totalMatched={totalMatched}
              lastSyncAt={gmail.lastSync?.completedAt ?? null}
              recentEmails={recentEmails}
            />
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming interviews.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingInterviews.map((app: Application) => (
                  <li key={app.id}>
                    <Link
                      href={`/applications/${app.id}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{app.company}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {formatDate(app.nextInterviewDate)}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
