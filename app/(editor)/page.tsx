"use client";

import { useCallback, useRef, useState } from "react";

import { TopBar } from "@/components/app-shell/top-bar";
import { WorkbenchShell } from "@/components/app-shell/workbench-shell";
import { EmptyState } from "@/components/editor/empty-state";
import { ResumeEditor, type ResumeEditorHandle, type SaveState } from "@/components/editor/resume-editor";
import { AtsLens } from "@/components/pdf/ats-lens";
import { LivePreview } from "@/components/pdf/live-preview";
import { createResume } from "@/lib/actions/resume";
import { defaultResumeContent, type ResumeContent } from "@/lib/schemas/resume";

import styles from "./page.module.css";

export default function EditorPage() {
  const [title, setTitle] = useState("Untitled resume");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle", lastSavedAt: null });
  const [previewContent, setPreviewContent] = useState<ResumeContent>(defaultResumeContent);
  const editorRef = useRef<ResumeEditorHandle>(null);

  const handleNewResume = useCallback(() => {
    void createResume(title).then(({ id }) => setResumeId(id));
  }, [title]);

  const handleSaveStateChange = useCallback((state: SaveState) => setSaveState(state), []);

  if (!resumeId) {
    return <EmptyState onNewResume={handleNewResume} />;
  }

  return (
    <div className={styles.page}>
      <TopBar
        title={title}
        onTitleChange={setTitle}
        saveStatus={saveState.status}
        lastSavedAt={saveState.lastSavedAt}
        onRetrySave={() => editorRef.current?.retry()}
      />
      <WorkbenchShell
        editor={
          <ResumeEditor
            ref={editorRef}
            resumeId={resumeId}
            initialValues={defaultResumeContent}
            onSaveStateChange={handleSaveStateChange}
            onContentChange={setPreviewContent}
          />
        }
        preview={
          <div className={styles.previewStack}>
            <LivePreview title={title} content={previewContent} />
            <AtsLens content={previewContent} />
          </div>
        }
      />
    </div>
  );
}
