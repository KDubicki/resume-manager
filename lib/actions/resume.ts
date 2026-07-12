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
    return { ok: false, error: "That draft didn't validate — nothing was saved." };
  }

  const { count } = await prisma.resume.updateMany({
    where: { id: resumeId, userId: DEMO_USER_ID, status: "DRAFT" },
    data: { content: parsed.data },
  });

  if (count === 0) {
    return { ok: false, error: "Couldn't find that draft to save." };
  }

  return { ok: true, savedAt: new Date().toISOString() };
}
