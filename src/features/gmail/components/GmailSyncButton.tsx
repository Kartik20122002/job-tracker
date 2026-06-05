"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

const COOLDOWN_MS = 30 * 60 * 1000;

interface SyncResult {
  status: string;
  emailsScanned: number;
  emailsMatched: number;
  duration: number;
  error?: string;
}

interface GmailSyncButtonProps {
  lastSyncedAt?: Date | string | null;
}

export function GmailSyncButton({ lastSyncedAt }: GmailSyncButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const lastSyncDate = lastSyncedAt ? new Date(lastSyncedAt) : null;
  const isOnCooldown = lastSyncDate !== null && Date.now() - lastSyncDate.getTime() < COOLDOWN_MS;
  const disabled = syncing || isOnCooldown;

  async function handleSync() {
    if (disabled) return;
    setSyncing(true);

    const toastId = toast.loading("Syncing Gmail...");

    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data: SyncResult = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error ?? "Sync failed. Please try again.", { id: toastId });
        return;
      }

      const durationSec = (data.duration / 1000).toFixed(1);
      toast.success(
        `Sync complete — ${data.emailsMatched} matched, ${data.emailsScanned} scanned (${durationSec}s)`,
        { id: toastId }
      );

      router.refresh();
    } catch {
      toast.error("Sync failed. Check your connection and try again.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={disabled}
        className="cursor-pointer"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Gmail"}
      </Button>
      {lastSyncDate && (
        <span className="text-xs text-muted-foreground">
          Synced {formatDistanceToNow(lastSyncDate, { addSuffix: true })}
        </span>
      )}
    </div>
  );
}
