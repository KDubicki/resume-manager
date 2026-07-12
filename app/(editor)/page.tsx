"use client";

import { App } from "antd";
import { useCallback, useRef, useState } from "react";

import { TopBar } from "@/components/app-shell/top-bar";
import { WorkbenchShell } from "@/components/app-shell/workbench-shell";
import { EmptyState } from "@/components/editor/empty-state";
import { ResumeEditor, type ResumeEditorHandle, type SaveState } from "@/components/editor/resume-editor";
import { AtsLens } from "@/components/pdf/ats-lens";
import { LivePreview } from "@/components/pdf/live-preview";
import { createResume } from "@/lib/actions/resume";
import { defaultResumeContent, type ResumeContent } from "@/lib/schemas/resume";
import { slugify } from "@/lib/slugify";

import styles from "./page.module.css";

export default function EditorPage() {
  const { message } = App.useApp();
  const [title, setTitle] = useState("Untitled resume");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle", lastSavedAt: null });
  const [previewContent, setPreviewContent] = useState<ResumeContent>(defaultResumeContent);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<ResumeEditorHandle>(null);

  const handleNewResume = useCallback(() => {
    void createResume(title).then(({ id }) => setResumeId(id));
  }, [title]);

  const handleSaveStateChange = useCallback((state: SaveState) => setSaveState(state), []);

  const handleExport = useCallback(async () => {
    if (!resumeId) return;
    setExporting(true);
    try {
      // Flush any pending edit first: export streams the persisted DB
      // content, so exporting the instant after typing must not ship a
      // stale draft.
      await editorRef.current?.retry();

      const response = await fetch(`/api/export/${resumeId}`);
      if (!response.ok) throw new Error(`export failed with ${response.status}`);

      const blob = await response.blob();
      const filename = `${slugify(title)}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      // The download attribute is only reliably honored once the element is
      // actually in the DOM — omitting this produced a random blob-UUID
      // filename instead of "<title>.pdf" in testing.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`Exported ${filename}`);
    } catch {
      message.error("Couldn't build the PDF. Your work is saved — try Export again.");
    } finally {
      setExporting(false);
    }
  }, [resumeId, title, message]);

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
        onExport={() => void handleExport()}
        exporting={exporting}
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
        onExport={() => void handleExport()}
        exporting={exporting}
      />
    </div>
  );
}
