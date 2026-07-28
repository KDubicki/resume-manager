"use server";

import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  applicationInputSchema,
  applicationStatusSchema,
  isSentStatus,
  MAX_JOB_DESCRIPTION_LENGTH,
  type ApplicationStatus,
} from "@/lib/schemas/application";

export type ApplicationResult = { ok: true; id: string } | { ok: false; error: string };

// A resume can only be attached to an application if it's the user's and isn't
// in the trash — same IDOR guard the resume actions and the export route use.
async function resolveResumeId(resumeId: string | null): Promise<string | null | "invalid"> {
  if (!resumeId) return null;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: DEMO_USER_ID, deletedAt: null },
    select: { id: true },
  });
  return resume ? resume.id : "invalid";
}

export async function createApplication(input: unknown): Promise<ApplicationResult> {
  const parsed = applicationInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That application didn't validate.",
    };
  }

  try {
    const resumeId = await resolveResumeId(parsed.data.resumeId);
    if (resumeId === "invalid") return { ok: false, error: "That resume isn't available." };

    const application = await prisma.application.create({
      data: {
        userId: DEMO_USER_ID,
        ...parsed.data,
        resumeId,
        // Creating something straight into a sent stage (a role you applied to
        // before you started tracking it) still gets a timestamp.
        appliedAt: isSentStatus(parsed.data.status) ? new Date() : null,
      },
      select: { id: true },
    });
    return { ok: true, id: application.id };
  } catch {
    return { ok: false, error: "A database error occurred while saving." };
  }
}

export async function updateApplication(
  applicationId: string,
  input: unknown,
): Promise<ApplicationResult> {
  const parsed = applicationInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That application didn't validate.",
    };
  }

  try {
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId: DEMO_USER_ID },
      select: { appliedAt: true },
    });
    if (!existing) return { ok: false, error: "Couldn't find that application." };

    const resumeId = await resolveResumeId(parsed.data.resumeId);
    if (resumeId === "invalid") return { ok: false, error: "That resume isn't available." };

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        ...parsed.data,
        resumeId,
        appliedAt: nextAppliedAt(existing.appliedAt, parsed.data.status),
      },
    });
    return { ok: true, id: applicationId };
  } catch {
    return { ok: false, error: "A database error occurred while saving." };
  }
}

// `appliedAt` records the FIRST time an application reached a sent stage, so it
// only ever gets stamped once. Moving back to SAVED (a posting you decided not
// to send after all) clears it; a rejection keeps the original date.
function nextAppliedAt(current: Date | null, status: ApplicationStatus): Date | null {
  if (status === "SAVED") return null;
  if (current) return current;
  return isSentStatus(status) ? new Date() : null;
}

export async function setApplicationStatus(
  applicationId: string,
  status: unknown,
): Promise<{ ok: boolean }> {
  const parsed = applicationStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false };

  try {
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId: DEMO_USER_ID },
      select: { appliedAt: true },
    });
    if (!existing) return { ok: false };

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: parsed.data,
        appliedAt: nextAppliedAt(existing.appliedAt, parsed.data),
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// Hard delete: an application carries no drafting work worth a trash bin, and
// the confirm step in the UI is the safety net. The resume it points at is
// untouched.
export async function deleteApplication(applicationId: string): Promise<{ ok: boolean }> {
  try {
    const { count } = await prisma.application.deleteMany({
      where: { id: applicationId, userId: DEMO_USER_ID },
    });
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}

// Called from the editor's job-description panel on a debounce, so the posting
// the ATS lens matches against survives a refresh instead of living in local
// component state.
export async function saveApplicationJobDescription(
  applicationId: string,
  jobDescription: string,
): Promise<{ ok: boolean }> {
  if (typeof jobDescription !== "string" || jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return { ok: false };
  }

  try {
    const { count } = await prisma.application.updateMany({
      where: { id: applicationId, userId: DEMO_USER_ID },
      data: { jobDescription },
    });
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}
