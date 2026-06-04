import Link from "next/link";
import { Suspense } from "react";
import { Download, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationsTable } from "@/features/applications/components/ApplicationsTable";
import { ApplicationFilters } from "@/features/applications/components/ApplicationFilters";
import { getApplications, PAGE_SIZE } from "@/server/queries/applications";
import { type ApplicationSource, type ApplicationStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    country?: string;
    source?: string;
    sort?: string;
    page?: string;
  }>;
}

function PaginationBar({
  page,
  total,
  pageSize,
  searchParams,
}: {
  page: number;
  total: number;
  pageSize: number;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
    params.set("page", p.toString());
    return `/applications?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildUrl(page - 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildUrl(page + 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;

  const { applications, total, page } = await getApplications(session!.user.id, {
    search: params.search,
    status: params.status as ApplicationStatus | undefined,
    country: params.country,
    source: params.source as ApplicationSource | undefined,
    sort: params.sort as "newest" | "oldest" | "company" | undefined,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-muted-foreground">{total} total applications</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export"
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
          <Link
            href="/applications/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Link>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ApplicationFilters />
      </Suspense>

      <ApplicationsTable applications={applications} />

      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} searchParams={params} />
    </div>
  );
}
