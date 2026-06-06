import type { Application } from "@/types/database";
import type { ParsedEmail } from "./gmail";

export type MatchedByValue =
  | "RECRUITER_EMAIL"
  | "RECRUITER_DOMAIN"
  | "COMPANY_SUBJECT"
  | "COMPANY_SNIPPET"
  | "POSITION_TITLE";

export interface MatchResult {
  score: number;
  matchedBy: MatchedByValue;
}

export function scoreEmailAgainstApplication(
  email: ParsedEmail,
  application: Pick<Application, "recruiterEmail" | "company" | "position">
): MatchResult | null {
  const senderEmail = email.senderEmail.toLowerCase();
  const subject = email.subject.toLowerCase();
  const snippet = email.snippet.toLowerCase();

  // Rule 1: Recruiter email exact match (score 100)
  if (application.recruiterEmail) {
    if (senderEmail === application.recruiterEmail.toLowerCase()) {
      return { score: 100, matchedBy: "RECRUITER_EMAIL" };
    }
  }

  // Rule 2: Recruiter domain match (score 80)
  if (application.recruiterEmail) {
    const recruiterDomain = application.recruiterEmail.split("@")[1]?.toLowerCase();
    const senderDomain = senderEmail.split("@")[1]?.toLowerCase();
    if (recruiterDomain && senderDomain && recruiterDomain === senderDomain) {
      return { score: 80, matchedBy: "RECRUITER_DOMAIN" };
    }
  }

  const company = application.company.toLowerCase().trim();
  const position = application.position.toLowerCase().trim();

  // Rule 3: Company name in subject (score 70)
  if (company.length >= 2 && subject.includes(company)) {
    return { score: 70, matchedBy: "COMPANY_SUBJECT" };
  }

  // Rule 4: Company name in snippet (score 60)
  if (company.length >= 2 && snippet.includes(company)) {
    return { score: 60, matchedBy: "COMPANY_SNIPPET" };
  }

  // Rule 5: Position title in subject (score 50)
  if (position.length >= 3 && subject.includes(position)) {
    return { score: 50, matchedBy: "POSITION_TITLE" };
  }

  return null;
}

export function buildSearchQueries(
  application: Pick<Application, "recruiterEmail" | "company" | "position">
): string[] {
  const queries: string[] = [];

  if (application.recruiterEmail?.trim()) {
    queries.push(`from:${application.recruiterEmail.trim()} newer_than:30d`);
  }

  if (application.company?.trim()) {
    queries.push(`${application.company.trim()} newer_than:30d`);
  }

  if (application.position?.trim()) {
    queries.push(`"${application.position.trim()}" newer_than:30d`);
  }

  return queries;
}
