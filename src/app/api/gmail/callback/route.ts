import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { exchangeCodeForTokens, getGmailProfile, GmailApiError } from "@/lib/gmail";
import { isProUser } from "@/lib/pro-access";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const settingsUrl = new URL("/settings", process.env.NEXTAUTH_URL!);

  if (!(await isProUser(session.user.email ?? ""))) {
    settingsUrl.searchParams.set("gmail_error", "pro_required");
    return NextResponse.redirect(settingsUrl);
  }

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

    await supabaseAdmin.from("GmailConnection").upsert(
      {
        userId: session.user.id,
        gmailAddress: profile.emailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      { onConflict: "userId" }
    );

    settingsUrl.searchParams.set("gmail_connected", "true");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const message = err instanceof GmailApiError ? err.message : "connection_failed";
    settingsUrl.searchParams.set("gmail_error", message);
    return NextResponse.redirect(settingsUrl);
  }
}
