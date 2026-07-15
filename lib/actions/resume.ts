"use server";

import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  resumeContentSchema,
  type ResumeTemplate,
} from "@/lib/schemas/resume";

export async function createResume(
  title: string,
  template: ResumeTemplate = "classic",
): Promise<{ id: string }> {
  // Build the starting content from the shared schema so the chosen template
  // is baked into the JSONB blob from creation (the template lives in
  // `content`, not a column).
  const content = resumeContentSchema.parse({ template });
  const resume = await prisma.resume.create({
    data: {
      userId: DEMO_USER_ID,
      title,
      content,
    },
  });
  return { id: resume.id };
}

export async function saveTitle(resumeId: string, title: string): Promise<{ ok: boolean }> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false };

  try {
    const { count } = await prisma.resume.updateMany({
      where: { id: resumeId, userId: DEMO_USER_ID, status: "DRAFT" },
      data: { title: trimmed },
    });
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
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
