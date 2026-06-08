import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusHistory } from "@/types/database";

interface StatusTimelineProps {
  history: StatusHistory[];
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No status history yet.</p>;
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {history.map((entry, index) => (
        <div key={entry.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5 min-w-30">
            <StatusBadge status={entry.newStatus} />
            <span className="text-xs text-muted-foreground text-center whitespace-nowrap">
              {formatDateTime(entry.changedAt)}
            </span>
          </div>
          {index < history.length - 1 && (
            <div className="h-px w-8 bg-border shrink-0 mb-4" />
          )}
        </div>
      ))}
    </div>
  );
}
