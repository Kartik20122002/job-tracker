import Link from "next/link";
import { Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { isProUser } from "@/lib/pro-access";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompaniesTable } from "@/features/companies/components/CompaniesTable";
import { getCompanies, COMPANY_PAGE_SIZE } from "@/server/queries/companies";
import { COMPANY_TAGS } from "@/lib/validations/company";
import { CompanyType } from "@/lib/enums";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    companyType?: string;
    tag?: string;
  }>;
}

const COMPANY_TYPE_OPTIONS = [
  { value: CompanyType.PRODUCT_BASED, label: "Product Based" },
  { value: CompanyType.SERVICE_BASED, label: "Service Based" },
  { value: CompanyType.OTHER, label: "Other" },
];

function buildUrl(searchParams: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...searchParams, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  return `/companies?${params.toString()}`;
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

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildUrl(searchParams, { page: (page - 1).toString() })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildUrl(searchParams, { page: (page + 1).toString() })}
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
    companyType: params.companyType,
    tag: params.tag,
  });

  const activeFilters = [params.companyType, params.tag].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-muted-foreground">{total} companies</p>
        </div>
      </div>

      <form method="get" action="/companies" className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by company name..."
            className="pl-8 h-8"
          />
        </div>

        <select
          name="companyType"
          defaultValue={params.companyType ?? ""}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Types</option>
          {COMPANY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          name="tag"
          defaultValue={params.tag ?? ""}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Tags</option>
          {COMPANY_TAGS.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
        >
          Filter
        </button>

        {(activeFilters > 0 || params.search) && (
          <Link
            href="/companies"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 text-muted-foreground")}
          >
            Clear
          </Link>
        )}
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
