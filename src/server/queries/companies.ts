import { supabaseAdmin } from "@/lib/supabase";

export const COMPANY_PAGE_SIZE = 20;

export async function getCompanies(
  filters: { search?: string; page?: number; companyType?: string; tag?: string } = {}
) {
  const { search, page = 1, companyType, tag } = filters;

  let query = supabaseAdmin
    .from("Company")
    .select("*", { count: "exact" })
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (companyType) {
    query = query.eq("companyType", companyType);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const from = (page - 1) * COMPANY_PAGE_SIZE;
  const to = from + COMPANY_PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return { companies: data ?? [], total: count ?? 0, page };
}
