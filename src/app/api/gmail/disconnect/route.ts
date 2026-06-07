import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isProUser } from "@/lib/pro-access";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isProUser(session.user.email ?? ""))) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  await supabaseAdmin
    .from("GmailConnection")
    .delete()
    .eq("userId", session.user.id);

  return NextResponse.json({ success: true });
}
