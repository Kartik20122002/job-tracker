"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Lock, Mail, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GmailConnectionCardProps {
  isConnected: boolean;
  gmailAddress: string | null;
  connectedAt: Date | null;
  isProUser: boolean;
}

export function GmailConnectionCard({
  isConnected,
  gmailAddress,
  connectedAt,
  isProUser,
}: GmailConnectionCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);

  // Show toast once after OAuth redirect
  useEffect(() => {
    const gmailError = searchParams.get("gmail_error");
    const gmailConnected = searchParams.get("gmail_connected");

    if (gmailError) {
      const messages: Record<string, string> = {
        access_denied: "Gmail connection was cancelled.",
        no_refresh_token: "No refresh token received. Please try connecting again.",
        connection_failed: "Gmail connection failed. Please try again.",
        pro_required: "Gmail integration is a Pro feature.",
      };
      toast.error(messages[gmailError] ?? `Connection error: ${gmailError}`);
      router.replace("/settings");
    } else if (gmailConnected === "true") {
      toast.success("Gmail connected successfully!");
      router.replace("/settings");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Disconnect failed");
      toast.success("Gmail disconnected.");
      router.refresh();
    } catch {
      toast.error("Failed to disconnect Gmail. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  if (!isProUser) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Gmail</span>
              <Badge variant="secondary" className="text-xs gap-1">
                <Lock className="h-3 w-3" />
                Pro only
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gmail sync is available on the Pro plan.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Button variant="outline" size="sm" disabled>
            Connect Gmail
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Gmail</span>
            {isConnected ? (
              <Badge variant="default" className="text-xs gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1">
                <WifiOff className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
          {isConnected && gmailAddress ? (
            <p className="text-sm text-muted-foreground">{gmailAddress}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your Gmail to automatically match recruiter emails to applications.
            </p>
          )}
          {isConnected && connectedAt && (
            <p className="text-xs text-muted-foreground">
              Connected on{" "}
              {new Date(connectedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        ) : (
          <a href="/api/gmail/connect" className={cn(buttonVariants({ size: "sm" }))}>
            Connect Gmail
          </a>
        )}
      </div>
    </div>
  );
}
