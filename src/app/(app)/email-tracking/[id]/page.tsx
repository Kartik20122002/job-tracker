import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEmailActivityById } from "@/server/queries/gmail";
import { getGmailMessageFull, refreshAccessToken } from "@/lib/gmail";
import { supabaseAdmin } from "@/lib/supabase";
import { EmailBodyFrame } from "@/features/gmail/components/EmailBodyFrame";
import { DeleteEmailButton } from "@/features/gmail/components/DeleteEmailButton";
import { formatDate, decodeHtmlEntities, cn } from "@/lib/utils";

const MATCHED_BY_LABEL: Record<string, string> = {
  RECRUITER_EMAIL: "Recruiter email",
  RECRUITER_DOMAIN: "Domain match",
  COMPANY_SUBJECT: "Company in subject",
  COMPANY_SNIPPET: "Company in body",
  POSITION_TITLE: "Position title",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmailDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const activity = await getEmailActivityById(id, session!.user.id);
  if (!activity) notFound();

  // Attempt to fetch full body server-side — fail gracefully if token issues
  let body: string | null = null;
  let bodyHtml: string | null = null;
  let gmailWebUrl = `https://mail.google.com/mail/u/0/#all/${activity.gmailThreadId}`;

  try {
    const { data: connection } = await supabaseAdmin
      .from("GmailConnection")
      .select("accessToken, refreshToken")
      .eq("userId", session!.user.id)
      .single();

    if (connection) {
      const accessToken = await refreshAccessToken(connection.refreshToken);
      await supabaseAdmin
        .from("GmailConnection")
        .update({ accessToken })
        .eq("userId", session!.user.id);

      const full = await getGmailMessageFull(accessToken, activity.gmailMessageId, activity.gmailThreadId);
      if (full) {
        body = full.body || null;
        bodyHtml = full.bodyHtml;
        gmailWebUrl = full.gmailWebUrl;
      }
    }
  } catch {
    // Body fetch failed — show stored data only
  }

  return (
    <div className="space-y-4 w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          href="/email-tracking"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Email Tracking
        </Link>
        <div className="flex items-center gap-2">
          <DeleteEmailButton id={activity.id} redirectTo="/email-tracking" />
          <a
            href={gmailWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Gmail
          </a>
        </div>
      </div>

      {/* Email metadata */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h1 className="text-lg font-semibold leading-snug">{activity.subject}</h1>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="font-medium text-foreground">From:</span>
              {activity.sender !== activity.senderEmail
                ?  <span>{activity.sender}, <span className="opacity-50">{activity.senderEmail}</span></span>
                : <span>{activity.senderEmail}</span>
                }
            </span>
            <span className="flex gap-2 items-center">
              <span className="font-medium text-foreground">Date:</span>
              <span>{formatDate(activity.receivedAt)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{MATCHED_BY_LABEL[activity.matchedBy] ?? activity.matchedBy}</Badge>
            <span className="text-sm text-muted-foreground">→</span>
            <Link
              href={`/applications/${activity.application.id}`}
              className="text-sm text-primary hover:underline"
            >
              {activity.application.company} — {activity.application.position}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Email body */}
      <Card>
        <CardContent className="pt-6">
          {bodyHtml ? (
            <EmailBodyFrame html={bodyHtml} />
          ) : body ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {body}
            </pre>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground italic">
                Full email body could not be loaded.
              </p>
              <Separator />
              <p className="text-sm text-muted-foreground">{decodeHtmlEntities(activity.snippet)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
