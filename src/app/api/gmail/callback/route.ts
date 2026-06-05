import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens, getGmailProfile, GmailApiError } from "@/lib/gmail";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const settingsUrl = new URL("/settings", process.env.NEXTAUTH_URL!);

  if (error || !code) {
    settingsUrl.searchParams.set("gmail_error", error ?? "access_denied");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      settingsUrl.searchParams.set("gmail_error", "no_refresh_token");
      return NextResponse.redirect(settingsUrl);
    }

    const profile = await getGmailProfile(tokens.access_token);

    await prisma.gmailConnection.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        gmailAddress: profile.emailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      update: {
        gmailAddress: profile.emailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    });

    settingsUrl.searchParams.set("gmail_connected", "true");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const message = err instanceof GmailApiError ? err.message : "connection_failed";
    settingsUrl.searchParams.set("gmail_error", message);
    return NextResponse.redirect(settingsUrl);
  }
}
