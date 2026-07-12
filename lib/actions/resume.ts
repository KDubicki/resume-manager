"use server";

import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { defaultResumeContent, resumeContentSchema } from "@/lib/schemas/resume";

export async function createResume(title: string): Promise<{ id: string }> {
  const resume = await prisma.resume.create({
    data: {
      userId: DEMO_USER_ID,
      title,
      content: defaultResumeContent,
    },
  });
  return { id: resume.id };
}

export type SaveDraftResult = { ok: true; savedAt: string } | { ok: false; error: string };

export async function saveDraft(resumeId: string, content: unknown): Promise<SaveDraftResult> {
  const parsed = resumeContentSchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, error: "content didn't validate" };
  }

  try {
    const { count } = await prisma.resume.updateMany({
      where: { id: resumeId, userId: DEMO_USER_ID, status: "DRAFT" },
      data: { content: parsed.data },
    });

    if (count === 0) {
      return { ok: false, error: "couldn't find that draft" };
    }

    return { ok: true, savedAt: new Date().toISOString() };
  } catch {
    // A Prisma/DB-level failure (connection drop, pool exhaustion, etc.) —
    // previously unguarded here, which meant it propagated as a rejected
    // promise instead of this typed result, leaving callers stuck.
    return { ok: false, error: "a database error occurred" };
  }
}
