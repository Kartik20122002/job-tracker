"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { RESUME_LIMITS } from "@/server/queries/resumes";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

const ResumeLinkSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  link: z.string().url("Must be a valid URL"),
});

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function createUserResume(
  name: string,
  link: string
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth();
  const userId = session.user.id;
  const subscription = session.user.subscription ?? "free";
  const limit = RESUME_LIMITS[subscription as keyof typeof RESUME_LIMITS] ?? RESUME_LIMITS.free;

  const parsed = ResumeLinkSchema.safeParse({ name, link });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { count } = await supabaseAdmin
    .from("UserResume")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId);

  if ((count ?? 0) >= limit) {
    return {
      success: false,
      error: `Resume limit reached (${limit} for ${subscription} plan). Delete an existing resume or upgrade your plan.`,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("UserResume")
    .insert({ userId, name: parsed.data.name, link: parsed.data.link })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to save resume link" };
  }

  revalidatePath("/profile");
  return { success: true, data: { id: data.id } };
}

export async function updateUserResume(
  id: string,
  name: string,
  link: string
): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = ResumeLinkSchema.safeParse({ name, link });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await supabaseAdmin
    .from("UserResume")
    .update({ name: parsed.data.name, link: parsed.data.link })
    .eq("id", id)
    .eq("userId", session.user.id);

  if (error) return { success: false, error: "Failed to update resume link" };

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteUserResume(id: string): Promise<ActionResult> {
  const session = await requireAuth();

  const { error } = await supabaseAdmin
    .from("UserResume")
    .delete()
    .eq("id", id)
    .eq("userId", session.user.id);

  if (error) return { success: false, error: "Failed to delete resume link" };

  revalidatePath("/profile");
  return { success: true };
}
