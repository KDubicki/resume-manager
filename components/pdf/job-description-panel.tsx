"use client";

import { Input } from "antd";
import { useState } from "react";

import styles from "./job-description-panel.module.css";

// Kept generous: real postings (responsibilities + requirements + boilerplate)
// routinely run long, and this text never leaves the browser — it's local
// state that feeds keyword matching (ATS-2), not part of the saved `content`.
const MAX_LENGTH = 20000;

export function JobDescriptionPanel({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = value.trim();

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={`font-mono ${styles.chip}`}
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        {trimmed ? "✓" : "·"} Target job
      </button>
      <div className={styles.body} data-expanded={expanded}>
        <div className={`font-mono ${styles.header}`}>
          <span className={styles.title}>TARGET JOB</span>
          <span className={styles.count} aria-live="polite">
            {trimmed ? `${value.length} chars` : "empty"}
          </span>
        </div>
        <Input.TextArea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MAX_LENGTH}
          autoSize={{ minRows: 4, maxRows: 12 }}
          placeholder="Paste a job description to target this resume."
          aria-label="Job description"
        />
        <div className={`font-mono ${styles.hint}`}>
          {trimmed
            ? "Stays in your browser — never saved to the resume."
            : "Local only — used to check how well this resume matches the role."}
        </div>
      </div>
    </div>
  );
}
