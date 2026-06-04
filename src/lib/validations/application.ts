import { z } from "zod";
import {
  ApplicationSource,
  ApplicationStatus,
  ApplicationType,
  Currency,
} from "@/generated/prisma/enums";

export const ApplicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position title is required"),
  country: z.string().min(1, "Country is required").default("India"),
  location: z.string().optional(),
  jobLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  jobDescLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  source: z.nativeEnum(ApplicationSource).default(ApplicationSource.Other),
  status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.Applied),

  applicationType: z
    .nativeEnum(ApplicationType)
    .default(ApplicationType.Onsite),
  visaSponsorship: z.boolean().default(false),
  relocation: z.boolean().default(false),
  referral: z.boolean().default(false),
  targetSalary: z.string().optional(),
  currency: z.nativeEnum(Currency).default(Currency.INR),

  appliedDate: z.coerce.date().default(() => new Date()),
  nextInterviewDate: z.coerce.date().optional().nullable(),
  offerDate: z.coerce.date().optional().nullable(),
  joiningDate: z.coerce.date().optional().nullable(),

  recruiterName: z.string().optional(),
  recruiterEmail: z
    .string()
    .email("Invalid recruiter email")
    .optional()
    .or(z.literal("")),
  recruiterLinkedIn: z.string().optional(),

  notes: z.string().optional(),
  interviewFeedback: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
export type ApplicationFormValues = z.input<typeof ApplicationSchema>;
