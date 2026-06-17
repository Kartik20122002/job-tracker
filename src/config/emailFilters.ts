// ─── Filtered Senders ────────────────────────────────────────────────────────
// Emails from these addresses are skipped during sync — they are job alert
// digests or promotional blasts, not actual recruiter communications.
// Add full addresses or domains (e.g. "@linkedin.com" matches any LinkedIn sender).
export const FILTERED_SENDERS: string[] = [
  "jobalerts-noreply@linkedin.com",
  "jobs-noreply@linkedin.com",
  "noreply@linkedin.com",
  "no-reply@linkedin.com",
  "noreply@glassdoor.com",
  "noreply@indeed.com",
  "alerts@indeed.com",
  "noreply@naukri.com",
  "alerts@naukri.com",
  "updates-noreply@linkedin.com",

  "no-reply@accounts.google.com", // google account access mail
];

// ─── Email Tags ───────────────────────────────────────────────────────────────
// Each tag is matched (case-insensitive) against the email subject + snippet.
// First matching tag wins per email.
export type EmailTagColor = "green" | "blue" | "red" | "gray" | "yellow";

export type EmailTag = {
  keywords: string[];
  label: string;
  color: EmailTagColor;
};

export const EMAIL_TAGS: EmailTag[] = [
  {
    keywords: ["congratulations", "pleased to offer", "offer letter", "job offer", "we'd like to offer", "we would like to offer"],
    label: "Possible Offer",
    color: "green",
  },
  {
    keywords: ["unfortunately", "other candidates", "regret to inform", "not moving forward", "not selected", "we will not", "decided to move forward with other", "not proceed", "not align"],
    label: "Possible Rejection",
    color: "red",
  },
  {
    keywords: ["thank you for applying", "received your application", "application received", "we have received"],
    label: "Applied",
    color: "gray",
  },
  {
    keywords: ["assessment", "online test", "coding challenge", "hackerrank", "codility", "assignment"],
    label: "Assessment",
    color: "yellow",
  },
  {
    keywords: ["interview", "schedule a call", "next steps", "move forward", "shortlisted", "selected for"],
    label: "Progress",
    color: "blue",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if this sender should be skipped entirely. */
export function isFilteredSender(senderEmail: string): boolean {
  const lower = senderEmail.toLowerCase().trim();
  return FILTERED_SENDERS.some((f) => {
    const filter = f.toLowerCase().trim();
    return filter.startsWith("@") ? lower.endsWith(filter) : lower === filter;
  });
}

/** Returns the first matching tag for the given subject + snippet, or null. */
export function getEmailTag(subject: string, snippet: string): EmailTag | null {
  const haystack = `${subject} ${snippet}`.toLowerCase();
  for (const tag of EMAIL_TAGS) {
    if (tag.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      return tag;
    }
  }
  return null;
}
