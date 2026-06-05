"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const STORAGE_KEY = "gmail_auto_sync_at";

interface GmailAutoSyncProps {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
}

export function GmailAutoSync({ isConnected, isSyncing, lastSyncAt }: GmailAutoSyncProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isConnected || isSyncing) return;

    // Persist trigger time in sessionStorage so remounts don't re-trigger
    const lastAutoSync = sessionStorage.getItem(STORAGE_KEY);
    if (lastAutoSync && Date.now() - parseInt(lastAutoSync) < THIRTY_MINUTES_MS) return;

    const isStale = !lastSyncAt || Date.now() - new Date(lastSyncAt).getTime() > THIRTY_MINUTES_MS;
    if (!isStale) return;

    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));

    let active = true;

    const run = async () => {
      try {
        const res = await fetch("/api/gmail/sync", { method: "POST" });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.status === "SUCCESS" && data.emailsMatched > 0) {
          toast.success(
            `Gmail sync — ${data.emailsMatched} new email${data.emailsMatched > 1 ? "s" : ""} matched`
          );
          router.refresh();
        }
      } catch {
        // auto-sync failures are silent
      }
    };

    run();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — capture mount-time values only

  return null;
}
