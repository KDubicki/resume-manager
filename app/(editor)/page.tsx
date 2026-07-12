"use client";

import { Typography } from "antd";
import { useState } from "react";

import { TopBar } from "@/components/app-shell/top-bar";
import { WorkbenchShell } from "@/components/app-shell/workbench-shell";
import { EmptyState } from "@/components/editor/empty-state";
import { ResumeEditor } from "@/components/editor/resume-editor";
import { defaultResumeContent, type ResumeContent } from "@/lib/schemas/resume";

import styles from "./page.module.css";

export default function EditorPage() {
  const [title, setTitle] = useState("Senior Engineer CV");
  const [content, setContent] = useState<ResumeContent | null>(null);

  if (!content) {
    return <EmptyState onNewResume={() => setContent(defaultResumeContent)} />;
  }

  return (
    <div className={styles.page}>
      <TopBar title={title} onTitleChange={setTitle} lastSavedAt={null} />
      <WorkbenchShell
        editor={<ResumeEditor initialValues={content} />}
        preview={
          <div className={styles.previewStack}>
            <div className={styles.paper}>
              {/* Plain element, not antd Typography: the paper stays a fixed
                  "ink on paper" color regardless of theme (see .paper in
                  page.module.css), so it must not pick up antd's
                  theme-aware text color. */}
              <span className="font-mono">The live PDF preview arrives in Steps 7–8.</span>
            </div>
            <div className={styles.atsLens}>
              <Typography.Text className="font-mono" style={{ fontSize: 12.5 }}>
                ATS Lens arrives in Step 8.
              </Typography.Text>
            </div>
          </div>
        }
      />
    </div>
  );
}
