import type {
  ApplicationStatus,
  ApplicationSource,
  ApplicationType,
  Currency,
  MatchedBy,
  SyncStatus,
} from "@/lib/enums";

export type Application = {
  id: string;
  userId: string;
  company: string;
  position: string;
  country: string;
  location: string | null;
  jobLink: string | null;
  jobDescLink: string | null;
  source: ApplicationSource;
  status: ApplicationStatus;
  applicationType: ApplicationType;
  visaSponsorship: boolean;
  relocation: boolean;
  referral: boolean;
  targetSalary: string | null;
  currency: Currency;
  appliedDate: string;
  nextInterviewDate: string | null;
  offerDate: string | null;
  joiningDate: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterLinkedIn: string | null;
  notes: string | null;
  interviewFeedback: string | null;
  resumeFileName: string | null;
  resumeFilePath: string | null;
  resumeUploadDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StatusHistory = {
  id: string;
  applicationId: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedAt: string;
};

export type ApplicationWithHistory = Application & {
  statusHistory: StatusHistory[];
};

export type EmailActivity = {
  id: string;
  applicationId: string;
  gmailMessageId: string;
  gmailThreadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  matchedBy: MatchedBy;
  createdAt: string;
};

export type EmailActivityWithApplication = EmailActivity & {
  application: { id: string; company: string };
};

export type GmailConnection = {
  id: string;
  userId: string;
  gmailAddress: string;
  accessToken: string;
  refreshToken: string;
  connectedAt: string;
  updatedAt: string;
};

export type GmailSync = {
  id: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  emailsScanned: number;
  emailsMatched: number;
  status: SyncStatus;
};

export type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};
