"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationSchema, type ApplicationInput, type ApplicationFormValues } from "@/lib/validations/application";
import { cn } from "@/lib/utils";
import {
  ApplicationSource,
  ApplicationStatus,
  ApplicationType,
  Currency,
} from "@/lib/enums";
import { createApplication, updateApplication } from "@/server/actions/applications";
import { ResumeSection } from "@/features/applications/components/ResumeSection";
import type { UserResume } from "@/types/database";

const STATUS_OPTIONS = Object.values(ApplicationStatus).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

const SOURCE_OPTIONS = Object.values(ApplicationSource).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

const TYPE_OPTIONS = Object.values(ApplicationType).map((v) => ({
  value: v,
  label: v,
}));

const CURRENCY_OPTIONS = Object.values(Currency).map((v) => ({ value: v, label: v }));

const COMPANY_TYPE_OPTIONS = [
  { value: "Product Based", label: "Product Based" },
  { value: "Service Based", label: "Service Based" },
  { value: "Other", label: "Other" },
];

interface ApplicationFormProps {
  applicationId?: string;
  defaultValues?: Partial<ApplicationFormValues>;
  savedResumes?: UserResume[];
  selectedResumeId?: string | null;
  resumeLimit?: number;
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-8 w-full items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 text-sm font-normal transition-colors hover:bg-muted",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="h-4 w-4 opacity-50" />
        {value ? format(value, "dd MMM yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ApplicationForm({
  applicationId,
  defaultValues,
  savedResumes = [],
  selectedResumeId,
  resumeLimit = 5,
}: ApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ApplicationFormValues, unknown, ApplicationInput>({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      company: "",
      position: "",
      country: "India",
      location: "",
      jobLink: "",
      companyType: "Other",
      source: ApplicationSource.Company_Website,
      status: ApplicationStatus.Started,
      applicationType: ApplicationType.Onsite,
      visaSponsorship: false,
      relocation: false,
      referral: false,
      targetSalary: "",
      currency: Currency.INR,
      appliedDate: new Date(),
      nextInterviewDate: null,
      offerDate: null,
      joiningDate: null,
      recruiterName: "",
      recruiterEmail: "",
      recruiterLinkedIn: "",
      notes: "",
      interviewFeedback: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: ApplicationInput): Promise<void> {
    setLoading(true);
    try {
      const result = applicationId
        ? await updateApplication(applicationId, values)
        : await createApplication(values);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(applicationId ? "Application updated" : "Application created");
      if (!applicationId && result.data) {
        router.push(`/applications/${result.data.id}`);
      } else {
        router.push(`/applications/${applicationId}`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="tracking">Dates & Recruiter</TabsTrigger>
            <TabsTrigger value="notes">Notes{applicationId ? " & Resume" : ""}</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Job Details = Basic + Preferences ── */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl><Input placeholder="Google" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Title *</FormLabel>
                      <FormControl><Input placeholder="Software Engineer" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl><Input placeholder="India" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl><Input placeholder="Bangalore" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((o) => (
                            <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {SOURCE_OPTIONS.map((o) => (
                            <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Link</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        value={!field.value ? "__none__" : field.value}
                      >
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {COMPANY_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <Separator className="my-1" />

              <CardHeader>
                <CardTitle className="text-base">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="applicationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {TYPE_OPTIONS.map((o) => (
                            <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="targetSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Salary</FormLabel>
                        <FormControl><Input placeholder="" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((o) => (
                              <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="visaSponsorship"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Visa Sponsorship Needed</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relocation"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Relocation Required</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referral"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Referral Available</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Dates + Recruiter ── */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="appliedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Applied *</FormLabel>
                      <FormControl>
                        <DatePickerField value={field.value as Date | null | undefined} onChange={field.onChange} placeholder="Select date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextInterviewDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Interview Date</FormLabel>
                      <FormControl>
                        <DatePickerField value={field.value as Date | null | undefined} onChange={field.onChange} placeholder="Select date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="offerDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Date</FormLabel>
                      <FormControl>
                        <DatePickerField value={field.value as Date | null | undefined} onChange={field.onChange} placeholder="Select date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining Date</FormLabel>
                      <FormControl>
                        <DatePickerField value={field.value as Date | null | undefined} onChange={field.onChange} placeholder="Select date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <Separator className="my-1" />

              <CardHeader>
                <CardTitle className="text-base">Recruiter Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="recruiterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recruiter Name</FormLabel>
                      <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recruiterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recruiter Email</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@company.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recruiterLinkedIn"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>LinkedIn Profile</FormLabel>
                      <FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Notes + Interview Feedback + Resume ── */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any notes about this application... (Markdown supported)" rows={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interviewFeedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Feedback</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Interview experiences, questions asked, performance notes... (Markdown supported)" rows={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              {applicationId && (
                <>
                  <Separator className="my-1" />
                  <CardHeader>
                    <CardTitle className="text-base">Resume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResumeSection
                      applicationId={applicationId}
                      savedResumes={savedResumes}
                      selectedResumeId={selectedResumeId}
                      resumeLimit={resumeLimit}
                    />
                  </CardContent>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {applicationId ? "Save Changes" : "Create Application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
