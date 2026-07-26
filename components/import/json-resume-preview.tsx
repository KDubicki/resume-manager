"use client";

import { Alert } from "antd";

import type { ImportPreview } from "@/lib/import/json-resume";

import styles from "./json-resume-preview.module.css";

// Compact summary of what a JSON Resume file will import: the detected identity,
// per-section counts, and a warning when the file didn't look like JSON Resume.
export function JsonResumePreview({
  preview,
  fileName,
}: {
  preview: ImportPreview;
  fileName?: string;
}) {
  const { content, counts, likely } = preview;
  const rows: [string, number][] = [
    ["Experience", counts.experience],
    ["Education", counts.education],
    ["Projects", counts.projects],
    ["Skill groups", counts.skills],
    ["Languages", counts.languages],
    ["Certifications", counts.certifications],
  ];
  const present = rows.filter(([, n]) => n > 0);
  const nothing = present.length === 0 && !content.summary.trim();

  return (
    <div className={styles.wrap}>
      {!likely ? (
        <Alert
          type="warning"
          showIcon
          message="This doesn't look like a JSON Resume file. You can still import it, but most sections may come through empty."
        />
      ) : null}

      {fileName ? <div className={`font-mono ${styles.file}`}>{fileName}</div> : null}

      <p className={styles.identity}>
        <strong>{content.contact.fullName || "(no name)"}</strong>
        {content.contact.headline ? ` — ${content.contact.headline}` : ""}
      </p>

      {nothing ? (
        <p className={styles.empty}>No recognizable resume content found.</p>
      ) : (
        <ul className={styles.counts}>
          {content.summary.trim() ? <li>Summary</li> : null}
          {present.map(([label, n]) => (
            <li key={label}>
              {n} {label.toLowerCase()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
