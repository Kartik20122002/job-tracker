import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Building2, ChevronLeft, ExternalLink, MapPin, Pencil } from "lucide-react";
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
import { getUserResumes, RESUME_LIMITS } from "@/server/queries/resumes";
import { ApplicationEmailSection } from "@/features/gmail/components/ApplicationEmailSection";
import { ReferralTemplateButton } from "@/features/applications/components/ReferralTemplateButton";
import { LinkedInSearchButton } from "@/features/applications/components/LinkedInSearchButton";
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
  const [application, emailActivities, gmail, savedResumes] = await Promise.all([
    getApplicationById(id, session!.user.id),
    isPro ? getEmailActivitiesForApplication(id) : Promise.resolve([]),
    isPro ? getGmailConnectionStatus(session!.user.id) : Promise.resolve(null),
    getUserResumes(session!.user.id),
  ]);

  if (!application) notFound();

  const resumeLimit = isPro ? RESUME_LIMITS.pro : RESUME_LIMITS.free;
  const selectedResume = savedResumes.find((r) => r.id === application.resumeId) ?? null;
  const hasNotes = !!application.notes;
  const hasFeedback = !!application.interviewFeedback;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-2">
          <Link
            href="/applications"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-0.5 shrink-0")}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold leading-tight">{application.position}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {application.company}
              </span>
              {application.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {application.location}{application.country ? `, ${application.country}` : ""}
                </span>
              )}
              {application.jobLink && (
                <a
                  href={application.jobLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  View Job Posting
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <LinkedInSearchButton company={application.company} />
          <ReferralTemplateButton
            company={application.company}
            position={application.position}
            jobLink={application.jobLink}
            resumeName={selectedResume?.name}
            resumeLink={selectedResume?.link}
          />
          <Link
            href={`/applications/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Link>
          <DeleteApplicationButton
            applicationId={id}
            company={application.company}
            position={application.position}
          />
        </div>
      </div>

      {/* Row 1: Grid 1 (2/5) + Grid 2 (3/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Grid 1: Application details (2-per-row) + resume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <InfoRow label="Status" value={<StatusBadge status={application.status} />} />
              <InfoRow label="Source" value={application.source.replace(/_/g, " ")} />
              <InfoRow label="Company Type" value={application.companyType} />
              <InfoRow
                label="Target Salary"
                value={application.targetSalary ? `${application.targetSalary} ${application.currency}` : null}
              />
              <InfoRow label="Work Type" value={application.applicationType} />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resume</p>
              <ResumeSection
                applicationId={id}
                savedResumes={savedResumes}
                selectedResumeId={application.resumeId}
                resumeLimit={resumeLimit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Grid 2: Dates + Preferences + Recruiter stacked, fields horizontal */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6 space-y-5">
            {/* Dates — fields horizontal */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dates</p>
              <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                <InfoRow label="Applied" value={formatDate(application.appliedDate)} />
                <InfoRow label="Next Interview" value={formatDate(application.nextInterviewDate)} />
                <InfoRow label="Offer Date" value={formatDate(application.offerDate)} />
                <InfoRow label="Joining Date" value={formatDate(application.joiningDate)} />
              </div>
            </div>

            <Separator />

            {/* Preferences — fields horizontal */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferences</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2">
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
              </div>
            </div>

            <Separator />

            {/* Recruiter — fields horizontal */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recruiter</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2">
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
                <InfoRow
                  label="LinkedIn"
                  value={
                    application.recruiterLinkedIn ? (
                      <a
                        href={application.recruiterLinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="h-3 w-3" /> Profile
                      </a>
                    ) : null
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid 3: Recruiter Emails — full width */}
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

      {/* Notes + Interview Feedback — full width */}
      {(hasNotes || hasFeedback) && (
        <div className={cn("grid gap-4", hasNotes && hasFeedback ? "md:grid-cols-2" : "grid-cols-1")}>
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

      {/* Grid 4: Status Timeline — full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline history={application.statusHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
