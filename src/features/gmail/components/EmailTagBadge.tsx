import { cn } from "@/lib/utils";
import type { EmailTag, EmailTagColor } from "@/config/emailFilters";

const COLOR_CLASSES: Record<EmailTagColor, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  gray: "bg-muted text-muted-foreground",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

interface EmailTagBadgeProps {
  tag: EmailTag | null;
  className?: string;
}

export function EmailTagBadge({ tag, className }: EmailTagBadgeProps) {
  if (!tag) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        COLOR_CLASSES[tag.color],
        className
      )}
    >
      {tag.label}
    </span>
  );
}
