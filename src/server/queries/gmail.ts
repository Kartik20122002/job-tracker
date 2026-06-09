import { supabaseAdmin } from "@/lib/supabase";
import type { EmailActivityWithApplication } from "@/types/database";

export async function getGmailConnectionStatus(userId: string) {
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

  return {
    isConnected: !!connection,
    gmailAddress: connection?.gmailAddress ?? null,
    connectedAt: connection?.connectedAt ?? null,
    lastSync: lastSync ?? null,
    isSyncing: !!runningSync,
  };
}

export async function getRecentEmailActivities(
  userId: string,
  limit = 5
): Promise<EmailActivityWithApplication[]> {
  const { data: apps } = await supabaseAdmin
    .from("Application")
    .select("id")
    .eq("userId", userId);

  const appIds = apps?.map((a) => a.id) ?? [];
  if (!appIds.length) return [];

  const { data } = await supabaseAdmin
    .from("EmailActivity")
    .select("*, Application!inner(id, company)")
    .in("applicationId", appIds)
    .is("deletedAt", null)
    .order("receivedAt", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const { Application: app, ...rest } = row as typeof row & { Application: { id: string; company: string } };
    return { ...rest, application: app };
  });
}

export async function getTotalMatchedEmails(userId: string): Promise<number> {
  const { data: apps } = await supabaseAdmin
    .from("Application")
    .select("id")
    .eq("userId", userId);

  const appIds = apps?.map((a) => a.id) ?? [];
  if (!appIds.length) return 0;

  const { count } = await supabaseAdmin
    .from("EmailActivity")
    .select("*", { count: "exact", head: true })
    .in("applicationId", appIds)
    .is("deletedAt", null);

  return count ?? 0;
}

export async function getEmailActivitiesForApplication(applicationId: string) {
  const { data } = await supabaseAdmin
    .from("EmailActivity")
    .select("*")
    .eq("applicationId", applicationId)
    .is("deletedAt", null)
    .order("receivedAt", { ascending: false });

  return data ?? [];
}

export async function getEmailActivityById(id: string, userId: string) {
  const { data } = await supabaseAdmin
    .from("EmailActivity")
    .select("*, Application!inner(id, company, position, userId)")
    .eq("id", id)
    .is("deletedAt", null)
    .single();

  if (!data) return null;

  const app = (data as typeof data & { Application: { id: string; company: string; position: string; userId: string } }).Application;
  if (!app || app.userId !== userId) return null;

  const { Application: _, ...rest } = data as typeof data & { Application: unknown };
  return {
    ...rest,
    application: { id: app.id, company: app.company, position: app.position },
  };
}
