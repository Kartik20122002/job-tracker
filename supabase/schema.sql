-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "CompanyType" AS ENUM (
  'PRODUCT_BASED',
  'SERVICE_BASED',
  'OTHER'
);

CREATE TYPE "ApplicationStatus" AS ENUM (
  'Started',
  'Referral_Asked',
  'Applied',
  'OA_Scheduled',
  'OA_Completed',
  'Recruiter_Screening',
  'Technical_Round_1',
  'Technical_Round_2',
  'Technical_Round_3',
  'Managerial_Round',
  'HR_Round',
  'Offer_Received',
  'Accepted',
  'Rejected',
  'Withdrawn'
);

CREATE TYPE "ApplicationSource" AS ENUM (
  'LinkedIn',
  'Naukri',
  'Indeed',
  'Company_Website',
  'Referral',
  'Glassdoor',
  'Other'
);

CREATE TYPE "ApplicationType" AS ENUM (
  'Remote',
  'Hybrid',
  'Onsite'
);

CREATE TYPE "Currency" AS ENUM (
  'INR',
  'USD',
  'EUR',
  'GBP'
);

CREATE TYPE "SyncStatus" AS ENUM (
  'RUNNING',
  'SUCCESS',
  'FAILED'
);

CREATE TYPE "MatchedBy" AS ENUM (
  'RECRUITER_EMAIL',
  'RECRUITER_DOMAIN',
  'COMPANY_SUBJECT',
  'COMPANY_SNIPPET',
  'POSITION_TITLE'
);

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "username"     TEXT        NOT NULL,
  "email"        TEXT        NOT NULL,
  "googleId"     TEXT,
  "subscription" TEXT        NOT NULL DEFAULT 'free',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User" ("username");
CREATE UNIQUE INDEX "User_email_key"    ON "User" ("email");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "Application" (
  "id"                TEXT               NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"            TEXT               NOT NULL,
  "company"           TEXT               NOT NULL,
  "position"          TEXT               NOT NULL,
  "country"           TEXT               NOT NULL DEFAULT 'India',
  "location"          TEXT,
  "jobLink"           TEXT,
  "companyType"       TEXT,
  "source"            "ApplicationSource" NOT NULL DEFAULT 'Other',
  "status"            "ApplicationStatus" NOT NULL DEFAULT 'Applied',
  "applicationType"   "ApplicationType"   NOT NULL DEFAULT 'Onsite',
  "visaSponsorship"   BOOLEAN            NOT NULL DEFAULT false,
  "relocation"        BOOLEAN            NOT NULL DEFAULT false,
  "referral"          BOOLEAN            NOT NULL DEFAULT false,
  "targetSalary"      TEXT,
  "currency"          "Currency"         NOT NULL DEFAULT 'INR',
  "appliedDate"       TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "nextInterviewDate" TIMESTAMPTZ,
  "offerDate"         TIMESTAMPTZ,
  "joiningDate"       TIMESTAMPTZ,
  "recruiterName"     TEXT,
  "recruiterEmail"    TEXT,
  "recruiterLinkedIn" TEXT,
  "notes"             TEXT,
  "interviewFeedback" TEXT,
  "resumeId"          TEXT,
  "createdAt"         TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT "Application_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId")
    REFERENCES "UserResume" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Application_userId_idx"            ON "Application" ("userId");
CREATE INDEX "Application_userId_status_idx"     ON "Application" ("userId", "status");
CREATE INDEX "Application_userId_appliedDate_idx" ON "Application" ("userId", "appliedDate");

-- Auto-update updatedAt on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Application_updatedAt"
  BEFORE UPDATE ON "Application"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "StatusHistory" (
  "id"            TEXT               NOT NULL DEFAULT gen_random_uuid()::text,
  "applicationId" TEXT               NOT NULL,
  "oldStatus"     "ApplicationStatus",
  "newStatus"     "ApplicationStatus" NOT NULL,
  "changedAt"     TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId")
    REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StatusHistory_applicationId_idx" ON "StatusHistory" ("applicationId");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "GmailConnection" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"       TEXT        NOT NULL,
  "gmailAddress" TEXT        NOT NULL,
  "accessToken"  TEXT        NOT NULL,
  "refreshToken" TEXT        NOT NULL,
  "historyId"    TEXT,
  "connectedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "GmailConnection_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "GmailConnection_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "GmailConnection_userId_key" ON "GmailConnection" ("userId");

CREATE TRIGGER "GmailConnection_updatedAt"
  BEFORE UPDATE ON "GmailConnection"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "GmailSync" (
  "id"            TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT         NOT NULL,
  "startedAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "completedAt"   TIMESTAMPTZ,
  "emailsScanned" INTEGER      NOT NULL DEFAULT 0,
  "emailsMatched" INTEGER      NOT NULL DEFAULT 0,
  "status"        "SyncStatus" NOT NULL DEFAULT 'RUNNING',

  CONSTRAINT "GmailSync_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GmailSync_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GmailSync_userId_idx"            ON "GmailSync" ("userId");
CREATE INDEX "GmailSync_userId_startedAt_idx"  ON "GmailSync" ("userId", "startedAt");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "EmailActivity" (
  "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "applicationId"  TEXT        NOT NULL,
  "gmailMessageId" TEXT        NOT NULL,
  "gmailThreadId"  TEXT        NOT NULL,
  "sender"         TEXT        NOT NULL,
  "senderEmail"    TEXT        NOT NULL,
  "subject"        TEXT        NOT NULL,
  "snippet"        TEXT        NOT NULL,
  "receivedAt"     TIMESTAMPTZ NOT NULL,
  "matchedBy"      "MatchedBy" NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt"      TIMESTAMPTZ,

  CONSTRAINT "EmailActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailActivity_applicationId_fkey" FOREIGN KEY ("applicationId")
    REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmailActivity_gmailMessageId_key" ON "EmailActivity" ("gmailMessageId");
CREATE INDEX        "EmailActivity_applicationId_idx"  ON "EmailActivity" ("applicationId");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "UserResume" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "link"      TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "UserResume_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserResume_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserResume_userId_idx" ON "UserResume" ("userId");

CREATE TRIGGER "UserResume_updatedAt"
  BEFORE UPDATE ON "UserResume"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "Company" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "name"          TEXT          NOT NULL,
  "companyType"   "CompanyType" NOT NULL DEFAULT 'OTHER',
  "careerPageUrl" TEXT          NOT NULL,
  "tags"          TEXT[]        NOT NULL DEFAULT '{}',
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_name_key" ON "Company" ("name");

CREATE TRIGGER "Company_updatedAt"
  BEFORE UPDATE ON "Company"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
