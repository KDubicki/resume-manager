import { notFound } from "next/navigation";

import { EditorClient } from "@/components/editor/editor-client";
import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { resumeContentSchema } from "@/lib/schemas/resume";

export const dynamic = "force-dynamic";

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Scoped by userId, not just id — mirrors the export route's IDOR guard: a
  // resume that belongs to someone else must 404 exactly like a missing one.
  const resume = await prisma.resume.findFirst({
    where: { id, userId: DEMO_USER_ID, deletedAt: null },
    select: { id: true, title: true, content: true },
  });

  if (!resume) {
    notFound();
  }

  // The application this resume was written for, if any. It carries the pasted
  // posting, which is what turns the ATS lens from "local until you refresh"
  // into something that survives coming back to the tab tomorrow. If a resume
  // is linked to several applications, the most recently touched one wins.
  const application = await prisma.application.findFirst({
    where: { resumeId: resume.id, userId: DEMO_USER_ID },
    orderBy: { updatedAt: "desc" },
    select: { id: true, company: true, role: true, jobDescription: true },
  });

  // Tolerant parse: the shared schema backfills any keys a legacy blob predates
  // (and this is the real fix for the editor always loading defaults — the
  // persisted content is what now seeds the form and preview).
  const content = resumeContentSchema.parse(resume.content);

  return (
    <EditorClient
      resumeId={resume.id}
      initialTitle={resume.title}
      initialValues={content}
      application={application}
    />
  );
}
