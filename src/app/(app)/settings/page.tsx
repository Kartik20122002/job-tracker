import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GmailConnectionCard } from "@/features/gmail/components/GmailConnectionCard";
import { getGmailConnectionStatus } from "@/server/queries/gmail";

export default async function SettingsPage() {
  const session = await auth();
  const gmail = await getGmailConnectionStatus(session!.user.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and integrations.</p>
      </div>

      <Separator />

      {/* Gmail Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gmail Integration</CardTitle>
          <CardDescription>
            Connect your Gmail account to automatically match recruiter emails with your
            applications. Only read access is requested — emails are never modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GmailConnectionCard
            isConnected={gmail.isConnected}
            gmailAddress={gmail.gmailAddress}
            connectedAt={gmail.connectedAt}
          />
        </CardContent>
      </Card>
    </div>
  );
}
