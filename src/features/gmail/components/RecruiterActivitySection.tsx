import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import type { EmailActivity } from "@/types/database";

const MATCHED_BY_LABEL: Record<string, string> = {
  RECRUITER_EMAIL: "Recruiter email",
  RECRUITER_DOMAIN: "Recruiter domain",
  COMPANY_SUBJECT: "Company in subject",
  COMPANY_SNIPPET: "Company in body",
  POSITION_TITLE: "Position title",
};

interface RecruiterActivitySectionProps {
  activities: EmailActivity[];
}

export function RecruiterActivitySection({ activities }: RecruiterActivitySectionProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Mail className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No recruiter emails matched yet.</p>
        <p className="text-xs text-muted-foreground">
          Sync Gmail from the dashboard to detect recruiter activity.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Date</th>
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Sender</th>
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Subject</th>
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Matched By</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {activities.map((activity) => (
            <tr key={activity.id} className="group">
              <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(activity.receivedAt)}
              </td>
              <td className="py-2 pr-4">
                <div className="min-w-0">
                  <p className="truncate font-medium max-w-[140px]">{activity.sender}</p>
                  <p className="truncate text-xs text-muted-foreground max-w-[140px]">
                    {activity.senderEmail}
                  </p>
                </div>
              </td>
              <td className="py-2 pr-4">
                <p className="truncate max-w-[200px]">{activity.subject}</p>
              </td>
              <td className="py-2">
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {MATCHED_BY_LABEL[activity.matchedBy] ?? activity.matchedBy}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
