"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ApplicationSchema, type ApplicationInput } from "@/lib/validations/application";
import { ApplicationStatus } from "@/lib/enums";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createApplication(
  data: ApplicationInput
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireAuth();

  const parsed = ApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { jobLink, companyType, recruiterEmail, ...rest } = parsed.data;

  const { data: app, error } = await supabaseAdmin
    .from("Application")
    .insert({
      ...rest,
      appliedDate: rest.appliedDate.toISOString(),
      nextInterviewDate: rest.nextInterviewDate?.toISOString() ?? null,
      offerDate: rest.offerDate?.toISOString() ?? null,
      joiningDate: rest.joiningDate?.toISOString() ?? null,
      jobLink: jobLink || null,
      companyType: companyType || null,
      recruiterEmail: recruiterEmail || null,
      userId,
    })
    .select("id, status")
    .single();

  if (error || !app) {
    return { success: false, error: "Failed to create application" };
  }

  await supabaseAdmin
    .from("StatusHistory")
    .insert({ applicationId: app.id, oldStatus: null, newStatus: app.status });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true, data: { id: app.id } };
}

export async function updateApplication(
  id: string,
  data: ApplicationInput
): Promise<ActionResult> {
  const userId = await requireAuth();

  const { data: existing } = await supabaseAdmin
    .from("Application")
    .select("status")
    .eq("id", id)
    .eq("userId", userId)
    .single();
  if (!existing) return { success: false, error: "Application not found" };

  const parsed = ApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { jobLink, companyType, recruiterEmail, ...rest } = parsed.data;

  if (rest.status !== existing.status) {
    await supabaseAdmin
      .from("StatusHistory")
      .insert({ applicationId: id, oldStatus: existing.status, newStatus: rest.status });
  }

  const { error } = await supabaseAdmin
    .from("Application")
    .update({
      ...rest,
      appliedDate: rest.appliedDate.toISOString(),
      nextInterviewDate: rest.nextInterviewDate?.toISOString() ?? null,
      offerDate: rest.offerDate?.toISOString() ?? null,
      joiningDate: rest.joiningDate?.toISOString() ?? null,
      jobLink: jobLink || null,
      companyType: companyType || null,
      recruiterEmail: recruiterEmail || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: "Failed to update application" };

  revalidatePath(`/applications/${id}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const userId = await requireAuth();

  const { data: existing } = await supabaseAdmin
    .from("Application")
    .select("id")
    .eq("id", id)
    .eq("userId", userId)
    .single();
  if (!existing) return { success: false, error: "Application not found" };

  const { error } = await supabaseAdmin
    .from("Application")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: "Failed to delete application" };

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function duplicateApplication(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireAuth();

  const { data: existing } = await supabaseAdmin
    .from("Application")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single();
  if (!existing) return { success: false, error: "Application not found" };

  const { data: app, error } = await supabaseAdmin
    .from("Application")
    .insert({
      userId: existing.userId,
      company: existing.company,
      position: existing.position,
      country: existing.country,
      location: existing.location,
      jobLink: existing.jobLink,
      companyType: existing.companyType,
      source: existing.source,
      status: ApplicationStatus.Applied,
      applicationType: existing.applicationType,
      visaSponsorship: existing.visaSponsorship,
      relocation: existing.relocation,
      referral: existing.referral,
      targetSalary: existing.targetSalary,
      currency: existing.currency,
      appliedDate: new Date().toISOString(),
      recruiterName: existing.recruiterName,
      recruiterEmail: existing.recruiterEmail,
      recruiterLinkedIn: existing.recruiterLinkedIn,
      notes: existing.notes,
      interviewFeedback: existing.interviewFeedback,
    })
    .select("id, status")
    .single();

  if (error || !app) return { success: false, error: "Failed to duplicate application" };

  await supabaseAdmin
    .from("StatusHistory")
    .insert({ applicationId: app.id, oldStatus: null, newStatus: ApplicationStatus.Applied });

  revalidatePath("/applications");
  return { success: true, data: { id: app.id } };
}

export async function updateApplicationResume(
  id: string,
  resumeFileName: string,
  resumeFilePath: string
): Promise<ActionResult> {
  const userId = await requireAuth();

  const { data: existing } = await supabaseAdmin
    .from("Application")
    .select("id")
    .eq("id", id)
    .eq("userId", userId)
    .single();
  if (!existing) return { success: false, error: "Application not found" };

  const { error } = await supabaseAdmin
    .from("Application")
    .update({ resumeFileName, resumeFilePath, resumeUploadDate: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: "Failed to update resume" };

  revalidatePath(`/applications/${id}`);
  return { success: true };
}
