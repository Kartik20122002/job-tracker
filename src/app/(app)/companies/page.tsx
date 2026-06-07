import Link from "next/link";
import { Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { isProUser } from "@/lib/pro-access";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompaniesTable } from "@/features/companies/components/CompaniesTable";
import { getCompanies, COMPANY_PAGE_SIZE } from "@/server/queries/companies";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

function PaginationBar({
  page,
  total,
  pageSize,
  searchParams,
  isProUser,
}: {
  page: number;
  total: number;
  pageSize: number;
  searchParams: Record<string, string | undefined>;
  isProUser: boolean;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  if (!isProUser && page === 1 && totalPages > 1) {
    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing 1–{Math.min(pageSize, total)} of {total}
        </span>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro to access all companies.
        </p>
      </div>
    );
  }

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
    params.set("page", p.toString());
    return `/companies?${params.toString()}`;
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

export default async function CompaniesPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const isPro = await isProUser(session!.user.email ?? "");

  const requestedPage = params.page ? parseInt(params.page) : 1;
  const page = isPro ? requestedPage : 1;

  const { companies, total } = await getCompanies({
    search: params.search,
    page,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-muted-foreground">{total} companies</p>
        </div>
      </div>

      <form method="get" action="/companies" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by company name..."
            className="pl-8 h-8"
          />
        </div>
      </form>

      {!isPro && requestedPage > 1 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm font-medium">Upgrade to Pro to access all companies.</p>
          <p className="text-sm text-muted-foreground">You can only view the first page on the free plan.</p>
        </div>
      ) : (
        <CompaniesTable companies={companies} isProUser={isPro} />
      )}

      <PaginationBar
        page={page}
        total={total}
        pageSize={COMPANY_PAGE_SIZE}
        searchParams={params}
        isProUser={isPro}
      />
    </div>
  );
}
