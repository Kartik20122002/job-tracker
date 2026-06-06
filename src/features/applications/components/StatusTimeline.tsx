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
    <div className="relative">
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
      <ul className="space-y-4">
        {history.map((entry, index) => (
          <li key={entry.id} className="flex gap-4 pl-10 relative">
            <div
              className={`absolute left-0 top-1 h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                index === history.length - 1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background text-muted-foreground"
              }`}
            >
              {history.length - index}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={entry.newStatus} />
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(entry.changedAt)}
                </span>
              </div>
              {entry.oldStatus && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  from {entry.oldStatus.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
