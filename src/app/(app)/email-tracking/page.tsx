import { Lock, Mail } from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GmailSyncButton } from "@/features/gmail/components/GmailSyncButton";
import { EmailTrackingList } from "@/features/gmail/components/EmailTrackingList";
import { getGmailConnectionStatus, getRecentEmailActivities } from "@/server/queries/gmail";
import { cn } from "@/lib/utils";
import { isProUser } from "@/lib/pro-access";

export default async function EmailTrackingPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isPro = await isProUser(session!.user.email ?? "");

  if (!isPro) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-bold">Email Tracking</h1>
          <p className="text-sm text-muted-foreground">Recruiter emails matched to your applications</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lock className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Pro feature</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Gmail sync and email tracking are available on the Pro plan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [gmail, emails] = await Promise.all([
    getGmailConnectionStatus(userId),
    getRecentEmailActivities(userId, 50),
  ]);

  return (
    <div className="space-y-6 w-full">
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
            <EmailTrackingList emails={emails} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
