import { auth } from "@/lib/auth";
import { isProUser } from "@/lib/pro-access";
import { getUserResumes, RESUME_LIMITS } from "@/server/queries/resumes";
import { getGmailConnectionStatus } from "@/server/queries/gmail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ResumeLinksManager } from "@/features/resumes/components/ResumeLinksManager";
import { Mail, User } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  const isPro = await isProUser(session!.user.email ?? "");

  const [resumes, gmail] = await Promise.all([
    getUserResumes(session!.user.id),
    isPro ? getGmailConnectionStatus(session!.user.id) : Promise.resolve(null),
  ]);

  const resumeLimit = isPro ? RESUME_LIMITS.pro : RESUME_LIMITS.free;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account, integrations, and resume links.</p>
      </div>

      <Separator />

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{session!.user.name ?? session!.user.email}</p>
              <p className="text-xs text-muted-foreground">{session!.user.email}</p>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className="capitalize">
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>

          {!isPro && (
            <div className="rounded-md bg-muted/50 px-3 py-2.5 text-sm">
              Want Pro access? Email{" "}
              <a
                href="mailto:kartikhatwar98@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                kartikhatwar98@gmail.com
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gmail Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Gmail Integration
          </CardTitle>
          <CardDescription>
            Automatic recruiter email matching for your applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isPro ? (
            <p className="text-sm text-muted-foreground">
              Gmail sync is a Pro feature.{" "}
              <a href="mailto:kartikhatwar98@gmail.com" className="text-primary hover:underline">
                Request Pro access
              </a>{" "}
              to enable it.
            </p>
          ) : gmail?.isConnected ? (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{gmail.gmailAddress}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
              <Link href="/settings" className="text-xs text-primary hover:underline">
                Manage →
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Not connected</p>
              <Link href="/settings" className="text-xs text-primary hover:underline">
                Connect in Settings →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume Links</CardTitle>
          <CardDescription>
            Save named resume links (Google Drive, Notion, Dropbox, etc.) to attach to applications
            and referral templates. {isPro ? "Pro plan" : "Free plan"}: up to {resumeLimit} links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeLinksManager resumes={resumes} limit={resumeLimit} />
        </CardContent>
      </Card>
    </div>
  );
}
