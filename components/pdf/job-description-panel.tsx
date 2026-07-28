"use client";

import { Input } from "antd";
import Link from "next/link";
import { useState } from "react";

import { MAX_JOB_DESCRIPTION_LENGTH } from "@/lib/schemas/application";

import styles from "./job-description-panel.module.css";

export function JobDescriptionPanel({
  value,
  onChange,
  linkedTo = null,
}: {
  value: string;
  onChange: (value: string) => void;
  /**
   * "Role · Company" when this resume is attached to a tracked application. The
   * posting is then stored on that application instead of living only in the
   * tab, so the hint says so rather than promising it never leaves the browser.
   */
  linkedTo?: string | null;
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
          <span className={styles.title}>{linkedTo ? linkedTo.toUpperCase() : "TARGET JOB"}</span>
          <span className={styles.count} aria-live="polite">
            {trimmed ? `${value.length} chars` : "empty"}
          </span>
        </div>
        <Input.TextArea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MAX_JOB_DESCRIPTION_LENGTH}
          autoSize={{ minRows: 4, maxRows: 12 }}
          placeholder="Paste a job description to target this resume."
          aria-label="Job description"
        />
        <div className={`font-mono ${styles.hint}`}>
          {linkedTo ? (
            <>
              Saved to this <Link href="/applications">application</Link> — still here next time.
            </>
          ) : trimmed ? (
            "Stays in your browser — track an application to keep it."
          ) : (
            "Local only — used to check how well this resume matches the role."
          )}
        </div>
      </div>
    </div>
  );
}
