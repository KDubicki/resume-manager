"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { useEffect, useRef, useState } from "react";

import type { ResumeContent } from "@/lib/schemas/resume";

import { registerPdfFonts } from "./register-fonts";
import { ResumeDocument } from "./resume-document";
import styles from "./live-preview.module.css";

export function LivePreview({ title, content }: { title: string; content: ResumeContent }) {
  const [fontsReady, setFontsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void registerPdfFonts().then(() => setFontsReady(true));
  }, []);

  // PDFViewerProps has no `title`/passthrough-attribute prop (it renders a
  // bare <iframe>), which axe-core flags as "frame-title" -- an iframe with
  // no accessible name. innerRef is the only hook available to set it.
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.title = "Live resume preview";
    }
  });

  if (!fontsReady) {
    return (
      <div className={styles.placeholder}>
        <span className="font-mono">Loading preview…</span>
      </div>
    );
  }

  return (
    <PDFViewer className={styles.viewer} showToolbar={false} innerRef={iframeRef}>
      <ResumeDocument title={title} content={content} />
    </PDFViewer>
  );
}
