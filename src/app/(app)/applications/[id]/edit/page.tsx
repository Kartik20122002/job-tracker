import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { isProUser } from "@/lib/pro-access";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationForm } from "@/features/applications/components/ApplicationForm";
import { getApplicationById } from "@/server/queries/applications";
import { getUserResumes, RESUME_LIMITS } from "@/server/queries/resumes";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditApplicationPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const isPro = await isProUser(session!.user.email ?? "");
  const [application, savedResumes] = await Promise.all([
    getApplicationById(id, session!.user.id),
    getUserResumes(session!.user.id),
  ]);
  const resumeLimit = isPro ? RESUME_LIMITS.pro : RESUME_LIMITS.free;

  if (!application) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/applications/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Application</h1>
          <p className="text-sm text-muted-foreground">
            {application.position} at {application.company}
          </p>
        </div>
      </div>
      <ApplicationForm
        applicationId={id}
        defaultValues={{
          company: application.company,
          position: application.position,
          country: application.country,
          location: application.location ?? undefined,
          jobLink: application.jobLink ?? undefined,
          companyType: application.companyType ?? "",
          source: application.source,
          status: application.status,
          applicationType: application.applicationType,
          visaSponsorship: application.visaSponsorship,
          relocation: application.relocation,
          referral: application.referral,
          targetSalary: application.targetSalary ?? undefined,
          currency: application.currency,
          appliedDate: application.appliedDate,
          nextInterviewDate: application.nextInterviewDate,
          offerDate: application.offerDate,
          joiningDate: application.joiningDate,
          recruiterName: application.recruiterName ?? undefined,
          recruiterEmail: application.recruiterEmail ?? undefined,
          recruiterLinkedIn: application.recruiterLinkedIn ?? undefined,
          notes: application.notes ?? undefined,
          interviewFeedback: application.interviewFeedback ?? undefined,
        }}
        savedResumes={savedResumes}
        selectedResumeId={application.resumeId}
        resumeLimit={resumeLimit}
      />
    </div>
  );
}
