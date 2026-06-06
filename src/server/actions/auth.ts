"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { SignupSchema } from "@/lib/validations/auth";

type SignupResult =
  | { success: true }
  | { success: false; error: string; field?: string };

export async function signup(data: unknown): Promise<SignupResult> {
  const parsed = SignupSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path[0] as string,
    };
  }

  const { username, email, password } = parsed.data;

  const { data: existingUsername } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("username", username)
    .single();
  if (existingUsername) {
    return { success: false, error: "Username is already taken", field: "username" };
  }

  const { data: existingEmail } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("email", email)
    .single();
  if (existingEmail) {
    return { success: false, error: "Email is already registered", field: "email" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { error } = await supabaseAdmin
    .from("User")
    .insert({ username, email, passwordHash });

  if (error) {
    return { success: false, error: "Failed to create account. Please try again." };
  }

  await signIn("credentials", { identifier: username, password, redirectTo: "/dashboard" });

  return { success: true };
}
