"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isProUser } from "@/lib/pro-access";
import { supabaseAdmin } from "@/lib/supabase";
import { CompanySchema, type CompanyInput } from "@/lib/validations/company";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requirePro() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const isPro = await isProUser(session.user.email ?? "");
  if (!isPro) throw new Error("Pro subscription required");
}

export async function createCompany(data: CompanyInput): Promise<ActionResult<{ id: string }>> {
  await requirePro();

  const parsed = CompanySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { linkedinUrl, ...rest } = parsed.data;

  const { data: company, error } = await supabaseAdmin
    .from("Company")
    .insert({ ...rest, linkedinUrl: linkedinUrl || null })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A company with this name already exists" };
    }
    return { success: false, error: "Failed to create company" };
  }

  revalidatePath("/companies");
  return { success: true, data: { id: company.id } };
}

export async function updateCompany(id: string, data: CompanyInput): Promise<ActionResult> {
  await requirePro();

  const parsed = CompanySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { linkedinUrl, ...rest } = parsed.data;

  const { error } = await supabaseAdmin
    .from("Company")
    .update({ ...rest, linkedinUrl: linkedinUrl || null })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A company with this name already exists" };
    }
    return { success: false, error: "Failed to update company" };
  }

  revalidatePath("/companies");
  return { success: true };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requirePro();

  const { error } = await supabaseAdmin.from("Company").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Failed to delete company" };
  }

  revalidatePath("/companies");
  return { success: true };
}
