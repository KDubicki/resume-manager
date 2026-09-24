"use client";

import { useEffect, useState } from "react";

import { buildMachineView, type MachineView } from "@/lib/ats/machine-view";

import styles from "./ats-sheet.module.css";
import { extractPdfLines } from "./extract-pdf-text";

// The latest extraction outcome, tagged with the blob it came from; a null
// view means that reading failed.
type Reading = { blob: Blob; view: MachineView | null };

// The back of the paper: the resume as a parser receives it. Extraction only
// runs while the sheet is turned over, and re-runs when a new PDF replaces the
// old one (each edit re-renders the preview).
export function AtsSheet({ blob, active }: { blob: Blob | null; active: boolean }) {
  const [reading, setReading] = useState<Reading | null>(null);
  const readBlob = reading?.blob ?? null;

  useEffect(() => {
    if (!active || !blob || readBlob === blob) return;
    let cancelled = false;
    extractPdfLines(blob)
      .then((pages) => {
        if (!cancelled) setReading({ blob, view: buildMachineView(pages) });
      })
      .catch(() => {
        if (!cancelled) setReading({ blob, view: null });
      });
    return () => {
      cancelled = true;
    };
  }, [active, blob, readBlob]);

  // While a newer PDF is being read, keep showing the previous reading (no
  // flash); only a failure of the latest one replaces it.
  const view = reading?.view ?? null;
  const failed = reading !== null && reading.view === null;

  return (
    <div className={`font-mono ${styles.sheet}`}>
      <header className={styles.header}>
        <div className={styles.title}>
          <span className={styles.mark} aria-hidden="true">
            ▚
          </span>
          What the ATS reads
        </div>
        <div className={styles.stats} aria-live="polite">
          {view
            ? `${view.words} words · ${view.sections.length} sections found · ${view.pages} ${
                view.pages === 1 ? "page" : "pages"
              }`
            : failed
              ? "Couldn't read the PDF text."
              : "Reading the PDF…"}
        </div>
      </header>

      {view ? (
        <>
          {/* One sweep per fresh reading, keyed so it replays on each edit. */}
          <div key={view.words + view.lines.length} className={styles.scan} aria-hidden="true" />
          <ol className={styles.lines}>
            {view.lines.map((line, index) => (
              <li
                key={line.number}
                className={styles.line}
                data-heading={line.heading || undefined}
              >
                {index > 0 && line.page !== view.lines[index - 1]!.page ? (
                  <div className={styles.pageBreak} aria-hidden="true">
                    page {line.page}
                  </div>
                ) : null}
                <span className={styles.number} aria-hidden="true">
                  {String(line.number).padStart(3, "0")}
                </span>
                <span className={styles.text}>
                  {line.heading ? (
                    <span className={styles.sectionMark} aria-label="Section heading: ">
                      §{" "}
                    </span>
                  ) : null}
                  {line.text}
                </span>
              </li>
            ))}
          </ol>
          <footer className={styles.footer}>
            Extracted from the exact PDF you export, in the order a parser reads it. Brass lines are
            the headings it can use to split your resume into sections.
          </footer>
        </>
      ) : null}
    </div>
  );
}
