import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GmailSyncButton } from "./GmailSyncButton";

interface EmailActivityItem {
  id: string;
  subject: string;
  receivedAt: Date;
  application: { company: string; id: string };
}

interface RecruiterUpdatesWidgetProps {
  isConnected: boolean;
  totalMatched: number;
  lastSyncAt: Date | null;
  recentEmails: EmailActivityItem[];
}

export function RecruiterUpdatesWidget({
  isConnected,
  totalMatched,
  lastSyncAt,
  recentEmails,
}: RecruiterUpdatesWidgetProps) {
  return (
    <div className="space-y-4">
      {/* Status row */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-muted-foreground"
              )}
            />
            {isConnected ? "Connected" : "Not connected"}
          </div>
          {isConnected && (
            <p className="text-xs text-muted-foreground">
              {totalMatched} matched &bull;{" "}
              {lastSyncAt
                ? `Synced ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`
                : "Never synced"}
            </p>
          )}
        </div>

        {isConnected ? (
          <GmailSyncButton lastSyncedAt={lastSyncAt} />
        ) : (
          <a
            href="/api/gmail/connect"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Mail className="mr-2 h-4 w-4" />
            Connect Gmail
          </a>
        )}
      </div>

      {/* Email list */}
      {isConnected && recentEmails.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No recruiter emails matched yet. Click Sync Gmail to scan your inbox.
        </p>
      )}

      {recentEmails.length > 0 && (
        <ul className="space-y-2">
          {recentEmails.map((email) => (
            <li key={email.id}>
              <Link
                href={`/applications/${email.application.id}`}
                className="flex items-start justify-between gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-muted-foreground uppercase tracking-wide">
                    {email.application.company}
                  </p>
                  <p className="text-sm truncate">{email.subject}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isConnected && (
        <p className="text-sm text-muted-foreground">
          Connect Gmail to automatically detect interview invitations, recruiter outreach,
          and rejections.
        </p>
      )}
    </div>
  );
}
