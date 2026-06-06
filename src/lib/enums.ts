export const ApplicationStatus = {
  Applied: "Applied",
  OA_Scheduled: "OA_Scheduled",
  OA_Completed: "OA_Completed",
  Recruiter_Screening: "Recruiter_Screening",
  Technical_Round_1: "Technical_Round_1",
  Technical_Round_2: "Technical_Round_2",
  Technical_Round_3: "Technical_Round_3",
  Managerial_Round: "Managerial_Round",
  HR_Round: "HR_Round",
  Offer_Received: "Offer_Received",
  Accepted: "Accepted",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const ApplicationSource = {
  LinkedIn: "LinkedIn",
  Naukri: "Naukri",
  Indeed: "Indeed",
  Company_Website: "Company_Website",
  Referral: "Referral",
  Glassdoor: "Glassdoor",
  Other: "Other",
} as const;
export type ApplicationSource = (typeof ApplicationSource)[keyof typeof ApplicationSource];

export const ApplicationType = {
  Remote: "Remote",
  Hybrid: "Hybrid",
  Onsite: "Onsite",
} as const;
export type ApplicationType = (typeof ApplicationType)[keyof typeof ApplicationType];

export const Currency = {
  INR: "INR",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

export const MatchedBy = {
  RECRUITER_EMAIL: "RECRUITER_EMAIL",
  RECRUITER_DOMAIN: "RECRUITER_DOMAIN",
  COMPANY_SUBJECT: "COMPANY_SUBJECT",
  COMPANY_SNIPPET: "COMPANY_SNIPPET",
  POSITION_TITLE: "POSITION_TITLE",
} as const;
export type MatchedBy = (typeof MatchedBy)[keyof typeof MatchedBy];

export const SyncStatus = {
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];
