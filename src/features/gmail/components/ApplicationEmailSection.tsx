"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteEmailActivity } from "@/server/actions/gmail";
import { getEmailTag } from "@/config/emailFilters";
import { EmailTagBadge } from "./EmailTagBadge";
import type { EmailActivity } from "@/types/database";

const MATCHED_BY_LABEL: Record<string, string> = {
  RECRUITER_EMAIL: "Recruiter email",
  RECRUITER_DOMAIN: "Domain",
  COMPANY_SUBJECT: "Company in subject",
  COMPANY_SNIPPET: "Company in body",
  POSITION_TITLE: "Position title",
};

interface ApplicationEmailSectionProps {
  applicationId: string;
  activities: EmailActivity[];
  gmailConnected: boolean;
}

export function ApplicationEmailSection({
  applicationId,
  activities: initialActivities,
  gmailConnected,
}: ApplicationEmailSectionProps) {
  const router = useRouter();
  const [fetching, setFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFetch() {
    if (!gmailConnected) {
      toast.error("Connect Gmail first in Settings.");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/api/gmail/sync-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Fetch failed.");
        return;
      }
      if (data.newCount > 0) {
        toast.success(`${data.newCount} new email${data.newCount > 1 ? "s" : ""} found.`);
        router.refresh();
      } else {
        toast.info("No new emails found.");
      }
    } catch {
      toast.error("Fetch failed. Please try again.");
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    try {
      const result = await deleteEmailActivity(id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete email.");
        return;
      }
      toast.success("Email removed.");
      router.refresh();
    } catch {
      toast.error("Failed to delete email.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {initialActivities.length === 0
            ? "No emails fetched yet."
            : `${initialActivities.length} email${initialActivities.length !== 1 ? "s" : ""} matched`}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleFetch}
          disabled={fetching}
          className="cursor-pointer shrink-0"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
          {fetching ? "Fetching..." : "Fetch latest"}
        </Button>
      </div>

      {initialActivities.length > 0 && (
        <div className="divide-y rounded-md border">
          {initialActivities.map((activity) => (
            <div key={activity.id} className="group relative">
              <Link
                href={`/email-tracking/${activity.id}`}
                className="flex items-start gap-3 px-3 py-2.5 pr-10 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{activity.subject}</span>
                    <EmailTagBadge tag={getEmailTag(activity.subject, activity.snippet)} />
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {MATCHED_BY_LABEL[activity.matchedBy] ?? activity.matchedBy}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.senderEmail} · {activity.snippet}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                  {formatDistanceToNow(new Date(activity.receivedAt), { addSuffix: true })}
                </span>
              </Link>
              <Button
                size="icon-sm"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                disabled={deletingId === activity.id}
                onClick={(e) => handleDelete(e, activity.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete email</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
