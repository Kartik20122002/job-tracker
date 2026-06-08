import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ExternalLink, MapPin, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { isProUser } from "@/lib/pro-access";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/features/applications/components/StatusTimeline";
import { ResumeSection } from "@/features/applications/components/ResumeSection";
import { DeleteApplicationButton } from "@/features/applications/components/DeleteApplicationButton";
import { getApplicationById } from "@/server/queries/applications";
import { getEmailActivitiesForApplication, getGmailConnectionStatus } from "@/server/queries/gmail";
import { ApplicationEmailSection } from "@/features/gmail/components/ApplicationEmailSection";
import { ReferralTemplateButton } from "@/features/applications/components/ReferralTemplateButton";
import { LinkedInSearchButton } from "@/features/applications/components/LinkedInSearchButton";
import { KeywordTailor } from "@/features/applications/components/KeywordTailor";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const isPro = await isProUser(session!.user.email ?? "");
  const [application, emailActivities, gmail] = await Promise.all([
    getApplicationById(id, session!.user.id),
    isPro ? getEmailActivitiesForApplication(id) : Promise.resolve([]),
    isPro ? getGmailConnectionStatus(session!.user.id) : Promise.resolve(null),
  ]);

  if (!application) notFound();

  const isUploadAllowed = isPro;

  const hasNotes = !!application.notes;
  const hasFeedback = !!application.interviewFeedback;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/applications"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{application.position}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{application.company}</span>
              {application.location && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{application.location}, {application.country}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={application.status} />
          <LinkedInSearchButton company={application.company} />
          <ReferralTemplateButton
            company={application.company}
            position={application.position}
            jobLink={application.jobLink}
          />
          <Link
            href={`/applications/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <DeleteApplicationButton
            applicationId={id}
            company={application.company}
            position={application.position}
          />
        </div>
      </div>

      {/* Row 1: App Details | Preferences | Recruiter */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Application Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Company" value={application.company} />
            <InfoRow label="Position" value={application.position} />
            <InfoRow label="Country" value={application.country} />
            <InfoRow label="Location" value={application.location} />
            <InfoRow label="Source" value={application.source.replace(/_/g, " ")} />
            <InfoRow label="Company Type" value={application.companyType} />
            <InfoRow label="Applied On" value={formatDate(application.appliedDate)} />
            {application.jobLink && (
              <div className="flex flex-col gap-1 pt-1">
                <a href={application.jobLink} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Job Posting
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Work Type" value={application.applicationType} />
            <InfoRow
              label="Target Salary"
              value={application.targetSalary ? `${application.targetSalary} ${application.currency}` : null}
            />
            <InfoRow
              label="Visa Sponsorship"
              value={
                <Badge variant={application.visaSponsorship ? "default" : "secondary"} className="text-xs">
                  {application.visaSponsorship ? "Required" : "Not Required"}
                </Badge>
              }
            />
            <InfoRow
              label="Relocation"
              value={
                <Badge variant={application.relocation ? "default" : "secondary"} className="text-xs">
                  {application.relocation ? "Required" : "Not Required"}
                </Badge>
              }
            />
            <InfoRow
              label="Referral"
              value={
                <Badge variant={application.referral ? "default" : "secondary"} className="text-xs">
                  {application.referral ? "Available" : "Not Available"}
                </Badge>
              }
            />

            <Separator />

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Important Dates</p>
            <InfoRow label="Applied" value={formatDate(application.appliedDate)} />
            <InfoRow label="Next Interview" value={formatDate(application.nextInterviewDate)} />
            <InfoRow label="Offer Date" value={formatDate(application.offerDate)} />
            <InfoRow label="Joining Date" value={formatDate(application.joiningDate)} />
          </CardContent>
        </Card>

        {/* Recruiter + Resume stacked */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">Recruiter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Name" value={application.recruiterName} />
              <InfoRow
                label="Email"
                value={
                  application.recruiterEmail ? (
                    <a href={`mailto:${application.recruiterEmail}`} className="text-primary hover:underline">
                      {application.recruiterEmail}
                    </a>
                  ) : null
                }
              />
              {application.recruiterLinkedIn && (
                <InfoRow
                  label="LinkedIn"
                  value={
                    <a href={application.recruiterLinkedIn} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm">
                      <ExternalLink className="h-3 w-3" /> Profile
                    </a>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumeSection
                applicationId={id}
                resumeFileName={application.resumeFileName}
                resumeFilePath={application.resumeFilePath}
                resumeUploadDate={application.resumeUploadDate ? new Date(application.resumeUploadDate) : null}
                isUploadAllowed={isUploadAllowed}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2: Notes + Interview Feedback (side by side if both exist) */}
      {(hasNotes || hasFeedback) && (
        <div className={cn("grid gap-4", hasNotes && hasFeedback ? "lg:grid-cols-2" : "grid-cols-1")}>
          {hasNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{application.notes!}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
          {hasFeedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interview Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{application.interviewFeedback!}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Row 3: Status Timeline full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <StatusTimeline history={application.statusHistory} />
        </CardContent>
      </Card>

      {/* Row 4: Recruiter Emails — Pro only */}
      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recruiter Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationEmailSection
              applicationId={id}
              activities={emailActivities}
              gmailConnected={gmail?.isConnected ?? false}
            />
          </CardContent>
        </Card>
      )}

      {/* Row 5: Keyword Match Tool */}
      <KeywordTailor
        position={application.position}
        notes={application.notes}
      />
    </div>
  );
}
