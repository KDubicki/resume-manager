import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { registerPdfFonts } from "@/components/pdf/register-fonts";
import { ResumeDocument } from "@/components/pdf/resume-document";
import { DEMO_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { resumeContentSchema } from "@/lib/schemas/resume";
import { slugify } from "@/lib/slugify";

// PDF rendering is CPU/memory-bound (see architecture.md); this must stay off
// the edge runtime.
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Scoped by userId, not just id — the IDOR guard. There's no real auth yet
  // (DEMO_USER_ID is a placeholder, see lib/constants.ts), but the query
  // shape is what real auth will slot into: a resume that exists but belongs
  // to someone else must 404 exactly like one that doesn't exist at all.
  const resume = await prisma.resume.findFirst({
    where: { id, userId: DEMO_USER_ID, deletedAt: null },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Re-validate before rendering: the shared schema is the only thing
  // allowed to shape what reaches the PDF renderer, even though saveDraft
  // already validated it once on the way in.
  const parsed = resumeContentSchema.safeParse(resume.content);
  if (!parsed.success) {
    return NextResponse.json({ error: "This draft's content didn't validate; export aborted." }, { status: 500 });
  }

  await registerPdfFonts();
  const buffer = await renderToBuffer(ResumeDocument({ title: resume.title, content: parsed.data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slugify(resume.title)}.pdf"`,
    },
  });
}
