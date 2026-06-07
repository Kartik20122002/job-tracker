import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isProUser } from "@/lib/pro-access";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isProUser(session.user.email ?? ""))) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const userId = session.user.id;

  const [{ data: connection }, { data: lastSync }, { data: runningSync }] = await Promise.all([
    supabaseAdmin
      .from("GmailConnection")
      .select("gmailAddress, connectedAt")
      .eq("userId", userId)
      .single(),
    supabaseAdmin
      .from("GmailSync")
      .select("completedAt, emailsScanned, emailsMatched")
      .eq("userId", userId)
      .eq("status", "SUCCESS")
      .order("completedAt", { ascending: false })
      .limit(1)
      .single(),
    supabaseAdmin
      .from("GmailSync")
      .select("startedAt")
      .eq("userId", userId)
      .eq("status", "RUNNING")
      .order("startedAt", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return NextResponse.json({
    isConnected: !!connection,
    gmailAddress: connection?.gmailAddress ?? null,
    connectedAt: connection?.connectedAt ?? null,
    lastSync: lastSync ?? null,
    isSyncing: !!runningSync,
  });
}
