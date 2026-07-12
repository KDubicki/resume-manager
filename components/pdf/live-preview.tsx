"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { useEffect, useState } from "react";

import type { ResumeContent } from "@/lib/schemas/resume";

import { registerPdfFonts } from "./register-fonts";
import { ResumeDocument } from "./resume-document";
import styles from "./live-preview.module.css";

export function LivePreview({ title, content }: { title: string; content: ResumeContent }) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    void registerPdfFonts().then(() => setFontsReady(true));
  }, []);

  if (!fontsReady) {
    return (
      <div className={styles.placeholder}>
        <span className="font-mono">Loading preview…</span>
      </div>
    );
  }

  return (
    <PDFViewer className={styles.viewer} showToolbar={false}>
      <ResumeDocument title={title} content={content} />
    </PDFViewer>
  );
}
