"use client";

import { useMemo, useState } from "react";

import { matchKeywords } from "@/lib/ats/keywords";
import { analyzeQuality } from "@/lib/ats/quality";
import { scoreResume } from "@/lib/ats/score";
import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./ats-lens.module.css";

// Below this share of matched JD keywords the check warns rather than passes —
// a resume echoing under ~60% of what the posting emphasizes is a real ATS risk.
const KEYWORD_PASS_RATIO = 0.6;

// The missing list is guidance, not an exhaustive dump; showing the top handful
// (already frequency-ranked) keeps it actionable and the panel compact.
const MAX_MISSING_SHOWN = 12;

// Same rationale for quality warnings (ATS-5): show the first handful and count
// the rest, so a rough draft doesn't bury the panel in a wall of hints.
const MAX_WARNINGS_SHOWN = 6;

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

export function AtsLens({
  content,
  jobDescription = "",
}: {
  content: ResumeContent;
  jobDescription?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sections = detectSections(content);
  // The Sidebar template is a deliberate two-column layout: an honest ATS
  // parser can interleave the two rails, so we flag it rather than hide it.
  // Classic stays a single linear pass.
  const isMultiColumn = content.template === "sidebar";

  // Keyword matching (ATS-2) only runs when a job description has been pasted
  // (ATS-1). Memoized because tokenizing the whole resume + JD on every preview
  // re-render would be wasteful.
  const hasJd = jobDescription.trim().length > 0;
  const keywords = useMemo(
    () => (hasJd ? matchKeywords(jobDescription, content) : null),
    [hasJd, jobDescription, content],
  );
  const keywordsStatus: "pass" | "warn" | "pending" =
    !keywords || keywords.total === 0
      ? "pending"
      : keywords.matched.length / keywords.total >= KEYWORD_PASS_RATIO
        ? "pass"
        : "warn";

  // Overall readiness (ATS-3). Memoized alongside the keyword match since it
  // reuses the same tokenization pass.
  const { score } = useMemo(() => scoreResume(content, jobDescription), [content, jobDescription]);
  const scoreBand = score >= 75 ? "good" : score >= 50 ? "fair" : "weak";

  // Quality warnings (ATS-5): empty sections, weak bullets, over-long text,
  // missing dates.
  const warnings = useMemo(() => analyzeQuality(content), [content]);

  return (
    <div className={styles.lens}>
      <button
        type="button"
        className={`font-mono ${styles.chip}`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-live="polite"
      >
        {isMultiColumn ? "⚠" : sections.length > 0 ? "✓" : "·"} ATS {score} · {sections.length}{" "}
        {sections.length === 1 ? "section" : "sections"}
      </button>
      <div className={`font-mono ${styles.panel}`} data-expanded={expanded} aria-live="polite">
        <div className={styles.title}>ATS VIEW</div>
        <div className={styles.meter}>
          <div className={styles.meterHead}>
            <span className={styles.label}>Readiness</span>
            <span className={styles.value}>{score} / 100</span>
          </div>
          <div
            className={styles.meterTrack}
            role="meter"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="ATS readiness score"
          >
            <div
              className={styles.meterFill}
              data-band={scoreBand}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
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
        {keywords && keywords.total > 0 && (
          <>
            <Row
              label="Keywords"
              value={`${keywords.matched.length} / ${keywords.total} matched`}
              status={keywordsStatus}
            />
            {keywords.missing.length > 0 && (
              <div className={styles.missing}>
                <div className={styles.missingLabel}>Missing from resume</div>
                <div className={styles.missingList}>
                  {keywords.missing.slice(0, MAX_MISSING_SHOWN).map((term) => (
                    <span key={term} className={styles.tag}>
                      {term}
                    </span>
                  ))}
                  {keywords.missing.length > MAX_MISSING_SHOWN && (
                    <span className={styles.tagMore}>
                      +{keywords.missing.length - MAX_MISSING_SHOWN} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <Row
          label="Quality"
          value={warnings.length === 0 ? "no issues" : `${warnings.length} to review`}
          status={warnings.length === 0 ? "pass" : "warn"}
        />
        {warnings.length > 0 && (
          <ul className={styles.warnings}>
            {warnings.slice(0, MAX_WARNINGS_SHOWN).map((warning) => (
              <li key={warning.key} className={styles.warning}>
                <span className={styles.checkWarn} aria-hidden="true">
                  ⚠
                </span>
                <span>{warning.message}</span>
              </li>
            ))}
            {warnings.length > MAX_WARNINGS_SHOWN && (
              <li className={styles.warningMore}>+{warnings.length - MAX_WARNINGS_SHOWN} more</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
