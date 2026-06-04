-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Applied', 'OA_Scheduled', 'OA_Completed', 'Recruiter_Screening', 'Technical_Round_1', 'Technical_Round_2', 'Technical_Round_3', 'Managerial_Round', 'HR_Round', 'Offer_Received', 'Accepted', 'Rejected', 'Withdrawn');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('LinkedIn', 'Naukri', 'Indeed', 'Company_Website', 'Referral', 'Glassdoor', 'Other');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('Remote', 'Hybrid', 'Onsite');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'USD', 'EUR', 'GBP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "location" TEXT,
    "jobLink" TEXT,
    "jobDescLink" TEXT,
    "source" "ApplicationSource" NOT NULL DEFAULT 'Other',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'Applied',
    "applicationType" "ApplicationType" NOT NULL DEFAULT 'Onsite',
    "visaSponsorship" BOOLEAN NOT NULL DEFAULT false,
    "relocation" BOOLEAN NOT NULL DEFAULT false,
    "referral" BOOLEAN NOT NULL DEFAULT false,
    "targetSalary" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'INR',
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextInterviewDate" TIMESTAMP(3),
    "offerDate" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3),
    "recruiterName" TEXT,
    "recruiterEmail" TEXT,
    "recruiterLinkedIn" TEXT,
    "notes" TEXT,
    "interviewFeedback" TEXT,
    "resumeFileName" TEXT,
    "resumeFilePath" TEXT,
    "resumeUploadDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "oldStatus" "ApplicationStatus",
    "newStatus" "ApplicationStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");

-- CreateIndex
CREATE INDEX "Application_userId_appliedDate_idx" ON "Application"("userId", "appliedDate");

-- CreateIndex
CREATE INDEX "StatusHistory_applicationId_idx" ON "StatusHistory"("applicationId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
