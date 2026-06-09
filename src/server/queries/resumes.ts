import { supabaseAdmin } from "@/lib/supabase";
import type { UserResume } from "@/types/database";

export const RESUME_LIMITS = {
  free: 5,
  pro: 15,
} as const;

export async function getUserResumes(userId: string): Promise<UserResume[]> {
  const { data, error } = await supabaseAdmin
    .from("UserResume")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
