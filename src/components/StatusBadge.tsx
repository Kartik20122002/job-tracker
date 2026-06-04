import { Badge } from "@/components/ui/badge";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  Applied: "Applied",
  OA_Scheduled: "OA Scheduled",
  OA_Completed: "OA Completed",
  Recruiter_Screening: "Recruiter Screening",
  Technical_Round_1: "Tech Round 1",
  Technical_Round_2: "Tech Round 2",
  Technical_Round_3: "Tech Round 3",
  Managerial_Round: "Managerial Round",
  HR_Round: "HR Round",
  Offer_Received: "Offer Received",
  Accepted: "Accepted",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  OA_Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  OA_Completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Recruiter_Screening: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  Technical_Round_1: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  Technical_Round_2: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  Technical_Round_3: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  Managerial_Round: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  HR_Round: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  Offer_Received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  Accepted: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Withdrawn: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium border-0 text-xs", STATUS_COLORS[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { STATUS_LABELS };
