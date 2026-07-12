"use client";

import { App } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

import { TopBar } from "@/components/app-shell/top-bar";
import { WorkbenchShell } from "@/components/app-shell/workbench-shell";
import { EmptyState } from "@/components/editor/empty-state";
import { ResumeEditor, type ResumeEditorHandle, type SaveState } from "@/components/editor/resume-editor";
import { AtsLens } from "@/components/pdf/ats-lens";
import { LivePreview } from "@/components/pdf/live-preview";
import { createResume, saveTitle } from "@/lib/actions/resume";
import { defaultResumeContent, type ResumeContent } from "@/lib/schemas/resume";
import { slugify } from "@/lib/slugify";

import styles from "./page.module.css";

const TITLE_SAVE_DELAY_MS = 1500;

export default function EditorPage() {
  const { message } = App.useApp();
  const [title, setTitle] = useState("Untitled resume");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    lastSavedAt: null,
    error: null,
  });
  const [previewContent, setPreviewContent] = useState<ResumeContent>(defaultResumeContent);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<ResumeEditorHandle>(null);

  const handleNewResume = useCallback(() => {
    void createResume(title).then(({ id }) => setResumeId(id));
  }, [title]);

  const handleSaveStateChange = useCallback((state: SaveState) => setSaveState(state), []);

  // Title edits (antd's Typography.Title editable) previously only updated
  // local state — never persisted — so a renamed resume's exported PDF
  // heading/filename kept showing the original, creation-time title. This
  // mirrors the content autosave's debounce, and flushTitle (used both here
  // and before export) always sends the latest ref value so a pending
  // rename can't be lost to a stale closure.
  const titleRef = useRef(title);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushTitle = useCallback(async () => {
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = null;
    }
    if (!resumeId) return;
    await saveTitle(resumeId, titleRef.current);
  }, [resumeId]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      // Safe here (an event-handler callback, not render): keeps flushTitle
      // reading the latest value without waiting on an effect to commit.
      titleRef.current = newTitle;
      if (!resumeId) return;
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = setTimeout(() => void flushTitle(), TITLE_SAVE_DELAY_MS);
    },
    [resumeId, flushTitle],
  );

  useEffect(() => {
    return () => {
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
    };
  }, []);

  const handleExport = useCallback(async () => {
    if (!resumeId) return;
    setExporting(true);
    try {
      // Flush any pending edits first (title, then content): export streams
      // the persisted DB row, so exporting the instant after typing must
      // not ship a stale title or draft. If the content save genuinely
      // failed, abort here instead of exporting a stale row while claiming
      // success (a stale title alone doesn't block export -- the retry
      // above will pick it up on next attempt).
      await flushTitle();
      const saved = await editorRef.current?.retry();
      if (saved === false) {
        message.error("Couldn't save your latest changes — try again before exporting.");
        return;
      }

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
  }, [resumeId, title, message, flushTitle]);

  if (!resumeId) {
    return <EmptyState onNewResume={handleNewResume} />;
  }

  return (
    <div className={styles.page}>
      <TopBar
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveState.status}
        lastSavedAt={saveState.lastSavedAt}
        saveError={saveState.error}
        onRetrySave={() => void editorRef.current?.retry()}
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
