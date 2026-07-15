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

export async function duplicateResume(
  resumeId: string,
): Promise<{ ok: true; id: string } | { ok: false }> {
  try {
    // Scoped by userId + not-trashed — a resume that isn't the user's, or is
    // in the trash, can't be copied.
    const source = await prisma.resume.findFirst({
      where: { id: resumeId, userId: DEMO_USER_ID, deletedAt: null },
      select: { title: true, content: true },
    });
    if (!source) return { ok: false };

    // Re-validate through the shared schema so the copy is written in exactly
    // the same shape the rest of the data layer guarantees.
    const content = resumeContentSchema.parse(source.content);
    const copy = await prisma.resume.create({
      data: { userId: DEMO_USER_ID, title: `${source.title} (copy)`, content },
    });
    return { ok: true, id: copy.id };
  } catch {
    return { ok: false };
  }
}

// Soft delete: move to the trash by stamping `deletedAt`. Reversible via
// restoreResume. All the "live" queries filter `deletedAt: null`, so a trashed
// resume vanishes from the dashboard, the editor, and export without the row
// actually being removed.
export async function deleteResume(resumeId: string): Promise<{ ok: boolean }> {
  try {
    // Scoped by userId, not just id — the same IDOR guard the rest of the data
    // layer uses. `deletedAt: null` makes this idempotent: re-trashing an
    // already-trashed resume matches nothing.
    const { count } = await prisma.resume.updateMany({
      where: { id: resumeId, userId: DEMO_USER_ID, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { ok: count > 0 };
  } catch {
    // A DB-level failure (connection drop, pool exhaustion) surfaces as a typed
    // result the caller can show, not an unhandled rejection.
    return { ok: false };
  }
}

export async function restoreResume(resumeId: string): Promise<{ ok: boolean }> {
  try {
    // Only restores something actually in the trash (`deletedAt: not null`).
    const { count } = await prisma.resume.updateMany({
      where: { id: resumeId, userId: DEMO_USER_ID, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}

// Hard delete — only reachable from the trash view. Guarded to `deletedAt: not
// null` so a live resume can never be permanently removed by id alone; it must
// be trashed first.
export async function deleteResumePermanently(resumeId: string): Promise<{ ok: boolean }> {
  try {
    const { count } = await prisma.resume.deleteMany({
      where: { id: resumeId, userId: DEMO_USER_ID, deletedAt: { not: null } },
    });
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}

export async function saveTitle(resumeId: string, title: string): Promise<{ ok: boolean }> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false };

  try {
    const { count } = await prisma.resume.updateMany({
      where: { id: resumeId, userId: DEMO_USER_ID, status: "DRAFT", deletedAt: null },
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
      where: { id: resumeId, userId: DEMO_USER_ID, status: "DRAFT", deletedAt: null },
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
