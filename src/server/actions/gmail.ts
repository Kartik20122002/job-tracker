"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type ActionResult = { success: true } | { success: false; error: string };

export async function deleteEmailActivity(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  // Verify the email belongs to this user via its application
  const { data } = await supabaseAdmin
    .from("EmailActivity")
    .select("id, Application!inner(userId, id)")
    .eq("id", id)
    .is("deletedAt", null)
    .single();

  if (!data) return { success: false, error: "Email not found" };

  const app = (data as typeof data & { Application: { userId: string; id: string } }).Application;
  if (app.userId !== userId) return { success: false, error: "Unauthorized" };

  const { error } = await supabaseAdmin
    .from("EmailActivity")
    .update({ deletedAt: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: "Failed to delete email" };

  revalidatePath(`/applications/${app.id}`);
  revalidatePath("/dashboard");
  return { success: true };
}
