import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGmailAuthUrl } from "@/lib/gmail";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  const url = buildGmailAuthUrl();
  return NextResponse.redirect(url);
}
