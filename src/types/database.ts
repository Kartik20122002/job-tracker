import type {
  ApplicationStatus,
  ApplicationSource,
  ApplicationType,
  CompanyType,
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
  companyType: string | null;
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
  deletedAt: string | null;
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
  historyId: string | null;
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
  subscription: "pro" | "free";
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  companyType: CompanyType;
  careerPageUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
