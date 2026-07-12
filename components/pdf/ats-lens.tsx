"use client";

import { useState } from "react";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./ats-lens.module.css";

function detectSections(content: ResumeContent): string[] {
  return [
    content.summary.trim() ? "Summary" : null,
    content.experience.length > 0 ? "Experience" : null,
    content.education.length > 0 ? "Education" : null,
    content.skills.length > 0 ? "Skills" : null,
  ].filter((section): section is string => section !== null);
}

function Row({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "pass" | "pending" | "info";
}) {
  return (
    <div className={styles.row}>
      <span className={status === "pass" ? styles.checkOk : styles.checkNeutral} aria-hidden="true">
        {status === "pass" ? "✓" : "·"}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export function AtsLens({ content }: { content: ResumeContent }) {
  const [expanded, setExpanded] = useState(false);
  const sections = detectSections(content);

  return (
    <div className={styles.lens}>
      <button
        type="button"
        className={`font-mono ${styles.chip}`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-live="polite"
      >
        {sections.length > 0 ? "✓" : "·"} ATS · {sections.length}{" "}
        {sections.length === 1 ? "section" : "sections"}
      </button>
      <div className={`font-mono ${styles.panel}`} data-expanded={expanded} aria-live="polite">
        <div className={styles.title}>ATS VIEW</div>
        {/* These first two are structural guarantees of ResumeDocument
            (components/pdf/resume-document.tsx) — real Text nodes with an
            embedded font, single-column layout — not something that can
            actually fail in this template, so they're always reported ok. */}
        <Row label="Text layer" value="detected" status="pass" />
        <Row label="Reading order" value="linear" status="pass" />
        <Row
          label="Sections"
          value={sections.length > 0 ? sections.join(", ") : "None yet"}
          status={sections.length > 0 ? "pass" : "pending"}
        />
        <Row label="Fonts" value="Roboto (embed)" status="info" />
      </div>
    </div>
  );
}
