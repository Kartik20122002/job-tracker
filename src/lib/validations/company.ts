import { z } from "zod";
import { CompanyType } from "@/lib/enums";

export const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  companyType: z.enum(CompanyType).default(CompanyType.OTHER),
  careerPageUrl: z.string().url("Career page must be a valid URL"),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type CompanyInput = z.infer<typeof CompanySchema>;
export type CompanyFormValues = z.input<typeof CompanySchema>;
