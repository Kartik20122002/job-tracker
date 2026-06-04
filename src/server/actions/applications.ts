"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApplicationSchema, type ApplicationInput } from "@/lib/validations/application";
import { ApplicationStatus } from "@/generated/prisma/client";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
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

  const { jobLink, jobDescLink, recruiterEmail, ...rest } = parsed.data;

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        ...rest,
        jobLink: jobLink || null,
        jobDescLink: jobDescLink || null,
        recruiterEmail: recruiterEmail || null,
        userId,
      },
    });
    await tx.statusHistory.create({
      data: {
        applicationId: app.id,
        oldStatus: null,
        newStatus: app.status,
      },
    });
    return app;
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true, data: { id: application.id } };
}

export async function updateApplication(
  id: string,
  data: ApplicationInput
): Promise<ActionResult> {
  const userId = await requireAuth();

  const existing = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!existing) return { success: false, error: "Application not found" };

  const parsed = ApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { jobLink, jobDescLink, recruiterEmail, ...rest } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (rest.status !== existing.status) {
      await tx.statusHistory.create({
        data: {
          applicationId: id,
          oldStatus: existing.status,
          newStatus: rest.status,
        },
      });
    }
    await tx.application.update({
      where: { id },
      data: {
        ...rest,
        jobLink: jobLink || null,
        jobDescLink: jobDescLink || null,
        recruiterEmail: recruiterEmail || null,
      },
    });
  });

  revalidatePath(`/applications/${id}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const userId = await requireAuth();

  const existing = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!existing) return { success: false, error: "Application not found" };

  await prisma.application.delete({ where: { id } });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function duplicateApplication(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireAuth();

  const existing = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!existing) return { success: false, error: "Application not found" };

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    resumeFileName: _resumeFileName,
    resumeFilePath: _resumeFilePath,
    resumeUploadDate: _resumeUploadDate,
    nextInterviewDate: _nextInterviewDate,
    offerDate: _offerDate,
    joiningDate: _joiningDate,
    statusHistory: _statusHistory,
    ...rest
  } = existing as typeof existing & { statusHistory?: unknown[] };

  const duplicate = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        ...rest,
        status: ApplicationStatus.Applied,
        appliedDate: new Date(),
        nextInterviewDate: null,
        offerDate: null,
        joiningDate: null,
        resumeFileName: null,
        resumeFilePath: null,
        resumeUploadDate: null,
      },
    });
    await tx.statusHistory.create({
      data: {
        applicationId: app.id,
        oldStatus: null,
        newStatus: ApplicationStatus.Applied,
      },
    });
    return app;
  });

  revalidatePath("/applications");
  return { success: true, data: { id: duplicate.id } };
}

export async function updateApplicationResume(
  id: string,
  resumeFileName: string,
  resumeFilePath: string
): Promise<ActionResult> {
  const userId = await requireAuth();

  const existing = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!existing) return { success: false, error: "Application not found" };

  await prisma.application.update({
    where: { id },
    data: { resumeFileName, resumeFilePath, resumeUploadDate: new Date() },
  });

  revalidatePath(`/applications/${id}`);
  return { success: true };
}
