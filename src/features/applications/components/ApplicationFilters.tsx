"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationSource, ApplicationStatus } from "@/lib/enums";

const STATUS_OPTIONS = Object.values(ApplicationStatus).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

const SOURCE_OPTIONS = Object.values(ApplicationSource).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "company", label: "Company Name" },
];

export function ApplicationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Keep a ref so the search debounce always calls the latest updateParam
  // without listing it as a dependency (avoids push→searchParams→updateParam→push loop)
  const updateParamRef = useRef(updateParam);
  useEffect(() => { updateParamRef.current = updateParam; });

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParamRef.current("search", search || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const activeOnly = searchParams.get("activeOnly") === "true";

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("status") ||
    searchParams.get("country") ||
    searchParams.get("source") ||
    searchParams.get("sort") ||
    activeOnly;

  function clearFilters() {
    setSearch("");
    router.push(pathname);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap items-start sm:items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search company or position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateParam("status", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("source") ?? "all"}
        onValueChange={(v) => updateParam("source", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {SOURCE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") ?? "newest"}
        onValueChange={(v) => updateParam("sort", v === "newest" ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={activeOnly ? "default" : "outline"}
        size="sm"
        onClick={() => updateParam("activeOnly", activeOnly ? null : "true")}
      >
        Active Only
      </Button>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
