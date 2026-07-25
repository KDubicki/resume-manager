import { Document } from "@react-pdf/renderer";

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
    <Document title={title}>
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
