import { auth } from "@/lib/auth";

export async function isProUser(email?: string): Promise<boolean> {
  const session = await auth();
  return session?.user?.subscription === "pro";
}
