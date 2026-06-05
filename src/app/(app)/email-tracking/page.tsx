import Link from "next/link";
import { Mail } from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GmailSyncButton } from "@/features/gmail/components/GmailSyncButton";
import { getGmailConnectionStatus, getRecentEmailActivities } from "@/server/queries/gmail";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function EmailTrackingPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [gmail, emails] = await Promise.all([
    getGmailConnectionStatus(userId),
    getRecentEmailActivities(userId, 50),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Email Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Recruiter emails matched to your applications
          </p>
        </div>

        {gmail.isConnected && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">{gmail.gmailAddress}</span>
            <GmailSyncButton lastSyncedAt={gmail.lastSync?.completedAt ?? null} />
          </div>
        )}
      </div>

      {!gmail.isConnected ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Gmail not connected</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect your Gmail account to start matching recruiter emails to your applications.
            </p>
            <a href="/api/gmail/connect" className={cn(buttonVariants())}>
              Connect Gmail
            </a>
          </CardContent>
        </Card>
      ) : emails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No emails matched yet</p>
            <p className="text-sm text-muted-foreground">
              Click Sync Gmail above to scan your inbox for recruiter emails.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Last {emails.length} matched email{emails.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {emails.map((email) => (
                <Link
                  key={email.id}
                  href={`/email-tracking/${email.id}`}
                  className="flex items-start gap-4 px-6 py-3 hover:bg-muted/40 transition-colors"
                >
                  <span className="shrink-0 w-24 pt-0.5 text-xs text-muted-foreground">
                    {formatDate(email.receivedAt)}
                  </span>
                  <span className="shrink-0 w-44 truncate pt-0.5 text-sm text-muted-foreground">
                    {email.senderEmail}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{email.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                  </div>
                  <span className="shrink-0 text-xs text-primary truncate max-w-30">
                    {email.application.company}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
