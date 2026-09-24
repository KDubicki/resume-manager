"use client";

import { SwapOutlined } from "@ant-design/icons";
import { pdf } from "@react-pdf/renderer";
import { useEffect, useRef, useState } from "react";

import type { ResumeContent } from "@/lib/schemas/resume";

import { AtsSheet } from "./ats-sheet";
import { registerPdfFonts } from "./register-fonts";
import { ResumeDocument } from "./resume-document";
import styles from "./live-preview.module.css";

// Renders the preview by building the PDF to a Blob with pdf().toBlob() and
// showing it in a plain <iframe> — the browser twin of the server export's
// renderToBuffer(). Both go through the same one-shot pdf() render, so "what you
// preview" is byte-for-byte "what you export".
//
// This deliberately avoids @react-pdf/renderer's <PDFViewer>: PDFViewer keeps a
// persistent react-pdf tree and appends/duplicates the document when its
// children update in place (every autosave/reorder), which rendered the whole
// resume multiple times in the preview. A fresh one-shot render per content
// change can't accumulate.
export function LivePreview({ title, content }: { title: string; content: ResumeContent }) {
  const [url, setUrl] = useState<string | null>(null);
  // The same blob the iframe shows, kept for the ATS sheet on the back.
  const [blob, setBlob] = useState<Blob | null>(null);
  // Front = the paper a person reads; back = the text a parser reads.
  const [flipped, setFlipped] = useState(false);
  const [failed, setFailed] = useState(false);
  // Track the last object URL so we can revoke it once a newer one replaces it,
  // instead of revoking eagerly (which could pull the rug from under the iframe
  // mid-swap). The iframe keeps displaying an already-loaded blob even after its
  // URL is revoked, so revoking the previous one on replacement is safe.
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await registerPdfFonts();
        const blob = await pdf(<ResumeDocument title={title} content={content} />).toBlob();
        if (cancelled) return;
        const next = URL.createObjectURL(blob);
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = next;
        setUrl(next);
        setBlob(blob);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [title, content]);

  // Revoke the final URL only when the component unmounts for good.
  useEffect(
    () => () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    },
    [],
  );

  const front = failed ? (
    <div className={styles.placeholder}>
      <span className="font-mono">Preview failed to render.</span>
    </div>
  ) : url ? (
    <iframe className={styles.viewer} title="Live resume preview" src={url} />
  ) : (
    // Keep showing the previous PDF (no blank flash) until the next blob is ready.
    <div className={styles.placeholder}>
      <span className="font-mono">Loading preview…</span>
    </div>
  );

  return (
    <div className={styles.stage}>
      <div className={styles.card} data-flipped={flipped || undefined}>
        <div className={styles.front} aria-hidden={flipped || undefined}>
          {front}
        </div>
        <div className={styles.back} aria-hidden={!flipped || undefined}>
          <AtsSheet blob={blob} active={flipped} />
        </div>
      </div>
      <button
        type="button"
        className={`font-mono ${styles.flip}`}
        onClick={() => setFlipped((value) => !value)}
        aria-pressed={flipped}
      >
        <SwapOutlined aria-hidden="true" />
        {flipped ? "Paper" : "ATS view"}
      </button>
    </div>
  );
}
