import { z } from "zod";
import { CompanyType } from "@/lib/enums";

export const COMPANY_TAGS = [
  "MAANG",
  "Big Tech",
  "Indian IT",
  "Indian",
  "Indian Startup",
  "Unicorn",
  "Fintech",
  "EdTech",
  "HealthTech",
  "DevTools",
  "Open Source",
  "Remote-First",
  "B2B SaaS",
  "E-commerce",
  "Travel",
  "Logistics",
  "HRTech",
  "Cybersecurity",
  "Data & Analytics",
  "Cloud & Infra",
  "AI/ML",
  "MarTech",
  "Semiconductor",
  "Gaming",
] as const;

export type CompanyTag = (typeof COMPANY_TAGS)[number];

export const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  companyType: z.enum(CompanyType).default(CompanyType.OTHER),
  careerPageUrl: z.string().url("Career page must be a valid URL"),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL must be a valid URL")
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string()).default([]),
});

export type CompanyInput = z.infer<typeof CompanySchema>;
export type CompanyFormValues = z.input<typeof CompanySchema>;
