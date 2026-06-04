"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { success: false, error: "Username is already taken", field: "username" };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, error: "Email is already registered", field: "email" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { username, email, passwordHash },
  });

  await signIn("credentials", { identifier: username, password, redirectTo: "/dashboard" });

  return { success: true };
}
