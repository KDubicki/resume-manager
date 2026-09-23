import { Document } from "@react-pdf/renderer";

import { pdfTitle } from "@/lib/export-name";
import type { ResumeContent } from "@/lib/schemas/resume";

import { ClassicTemplate } from "./templates/classic-template";
import { MinimalTemplate } from "./templates/minimal-template";
import { ModernTemplate } from "./templates/modern-template";
import { SidebarTemplate } from "./templates/sidebar-template";

// Single entry point for BOTH the live preview (live-preview.tsx) and the
// export stream (app/api/export/[id]/route.ts). It only dispatches on
// content.template, so "what you preview" is always "what you export" — the
// two render paths can never fork into different layouts. Adding a template
// means one more case here (+ a template component + an enum value), never a
// second render path.
export function ResumeDocument({ title, content }: { title: string; content: ResumeContent }) {
  return (
    // Metadata a recruiter's viewer and an ATS read: the candidate, not the
    // user's internal resume label.
    <Document
      title={pdfTitle(title, content)}
      author={content.contact.fullName.trim() || undefined}
      subject={content.contact.headline.trim() || undefined}
      creator="Resume Manager"
    >
      {content.template === "sidebar" ? (
        <SidebarTemplate title={title} content={content} />
      ) : content.template === "modern" ? (
        <ModernTemplate title={title} content={content} />
      ) : content.template === "minimal" ? (
        <MinimalTemplate title={title} content={content} />
      ) : (
        <ClassicTemplate title={title} content={content} />
      )}
    </Document>
  );
}
