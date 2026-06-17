"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate, decodeHtmlEntities } from "@/lib/utils";
import { deleteEmailActivity } from "@/server/actions/gmail";
import { getEmailTag } from "@/config/emailFilters";
import { EmailTagBadge } from "./EmailTagBadge";
import type { EmailActivityWithApplication } from "@/types/database";

interface EmailTrackingListProps {
  emails: EmailActivityWithApplication[];
}

export function EmailTrackingList({ emails }: EmailTrackingListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <div className="divide-y">
      {emails.map((email) => (
        <div key={email.id} className="group relative">
          <Link
            href={`/email-tracking/${email.id}`}
            className="flex items-start gap-4 px-6 py-3 pr-12 hover:bg-muted/40 transition-colors"
          >
            <span className="shrink-0 w-24 pt-0.5 text-xs text-muted-foreground">
              {formatDate(email.receivedAt)}
            </span>
            <span className="shrink-0 w-44 truncate pt-0.5 text-sm text-muted-foreground">
              {email.senderEmail}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{email.subject}</p>
                <EmailTagBadge tag={getEmailTag(email.subject, email.snippet)} />
              </div>
              <p className="text-xs text-muted-foreground truncate">{decodeHtmlEntities(email.snippet)}</p>
            </div>
            <span className="shrink-0 text-xs text-primary truncate max-w-30">
              {email.application.company}
            </span>
          </Link>
          <Button
            size="icon-sm"
            variant="ghost"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            disabled={deletingId === email.id}
            onClick={(e) => handleDelete(e, email.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete email</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
