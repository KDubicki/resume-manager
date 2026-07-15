"use client";

import { useState } from "react";

import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./ats-lens.module.css";

function detectSections(content: ResumeContent): string[] {
  return [
    content.summary.trim() ? "Summary" : null,
    content.experience.length > 0 ? "Experience" : null,
    content.education.length > 0 ? "Education" : null,
    content.projects.length > 0 ? "Projects" : null,
    content.skillGroups.length > 0 ? "Skills" : null,
    content.languages.length > 0 ? "Languages" : null,
    content.certifications.length > 0 ? "Certifications" : null,
    content.interests.trim() ? "Interests" : null,
  ].filter((section): section is string => section !== null);
}

function Row({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "pass" | "pending" | "info" | "warn";
}) {
  return (
    <div className={styles.row}>
      <span
        className={
          status === "pass"
            ? styles.checkOk
            : status === "warn"
              ? styles.checkWarn
              : styles.checkNeutral
        }
        aria-hidden="true"
      >
        {status === "pass" ? "✓" : status === "warn" ? "⚠" : "·"}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export function AtsLens({ content }: { content: ResumeContent }) {
  const [expanded, setExpanded] = useState(false);
  const sections = detectSections(content);
  // The Sidebar template is a deliberate two-column layout: an honest ATS
  // parser can interleave the two rails, so we flag it rather than hide it.
  // Classic stays a single linear pass.
  const isMultiColumn = content.template === "sidebar";

  return (
    <div className={styles.lens}>
      <button
        type="button"
        className={`font-mono ${styles.chip}`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-live="polite"
      >
        {isMultiColumn ? "⚠" : sections.length > 0 ? "✓" : "·"} ATS · {sections.length}{" "}
        {sections.length === 1 ? "section" : "sections"}
      </button>
      <div className={`font-mono ${styles.panel}`} data-expanded={expanded} aria-live="polite">
        <div className={styles.title}>ATS VIEW</div>
        {/* Text layer is a structural guarantee of every template — real Text
            nodes with an embedded font — so it's always ok. Reading order
            depends on the template: Classic is a single linear pass; Sidebar
            is two columns, which a parser can interleave. */}
        <Row label="Text layer" value="detected" status="pass" />
        {isMultiColumn ? (
          <Row label="Reading order" value="2-column — may reduce parsing" status="warn" />
        ) : (
          <Row label="Reading order" value="linear" status="pass" />
        )}
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
