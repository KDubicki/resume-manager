"use client";

import { App } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { TopBar } from "@/components/app-shell/top-bar";
import { WorkbenchShell } from "@/components/app-shell/workbench-shell";
import { ResumeEditor, type ResumeEditorHandle, type SaveState } from "@/components/editor/resume-editor";
import { AtsLens } from "@/components/pdf/ats-lens";
import { LivePreview } from "@/components/pdf/live-preview";
import { saveTitle } from "@/lib/actions/resume";
import type { ResumeContent } from "@/lib/schemas/resume";
import { slugify } from "@/lib/slugify";

import styles from "./editor-client.module.css";

const TITLE_SAVE_DELAY_MS = 1500;

export function EditorClient({
  resumeId,
  initialTitle,
  initialValues,
}: {
  resumeId: string;
  initialTitle: string;
  initialValues: ResumeContent;
}) {
  const { message } = App.useApp();
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    lastSavedAt: null,
    error: null,
  });
  // Seeded with the persisted content (not defaults) so the preview is correct
  // on first paint, before the user touches anything.
  const [previewContent, setPreviewContent] = useState<ResumeContent>(initialValues);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<ResumeEditorHandle>(null);

  const handleSaveStateChange = useCallback((state: SaveState) => setSaveState(state), []);

  // Title edits (antd's Typography.Title editable) persist on a debounce that
  // mirrors the content autosave; flushTitle (used here and before export)
  // always sends the latest ref value so a pending rename can't be lost to a
  // stale closure.
  const titleRef = useRef(title);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushTitle = useCallback(async () => {
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = null;
    }
    await saveTitle(resumeId, titleRef.current);
  }, [resumeId]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      titleRef.current = newTitle;
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = setTimeout(() => void flushTitle(), TITLE_SAVE_DELAY_MS);
    },
    [flushTitle],
  );

  useEffect(() => {
    return () => {
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);
    };
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Flush any pending edits first (title, then content): export streams
      // the persisted DB row, so exporting the instant after typing must not
      // ship a stale title or draft. If the content save genuinely failed,
      // abort instead of exporting a stale row while claiming success.
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
      // actually in the DOM.
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

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        ← All resumes
      </Link>
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
            initialValues={initialValues}
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
