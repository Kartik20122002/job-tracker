import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGmailAuthUrl } from "@/lib/gmail";
import { isProUser } from "@/lib/pro-access";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  if (!(await isProUser(session.user.email ?? ""))) {
    return NextResponse.redirect(new URL("/settings?gmail_error=pro_required", process.env.NEXTAUTH_URL!));
  }

  const url = buildGmailAuthUrl();
  return NextResponse.redirect(url);
}
