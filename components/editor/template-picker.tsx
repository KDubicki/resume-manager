"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  DEFAULT_ACCENT,
  TEMPLATE_LABELS,
  type ResumeContent,
  type ResumeTemplate,
} from "@/lib/schemas/resume";

import { SectionCard } from "./section-card";
import styles from "./template-picker.module.css";

const TEMPLATES = Object.keys(TEMPLATE_LABELS) as ResumeTemplate[];

// Same rule the ATS Lens applies: Sidebar is the one two-column layout, and
// the picker states that trade-off at the moment of choice, not after.
const isTwoColumn = (template: ResumeTemplate) => template === "sidebar";

// A schematic of the page, not a render: enough shape to tell the four layouts
// apart at a glance. Per-template styling lives in the CSS (data-template).
function Miniature({ template, accent }: { template: ResumeTemplate; accent: string }) {
  return (
    <span
      className={styles.page}
      data-template={template}
      style={{ "--tpl-accent": accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.head} />
      <span className={styles.body}>
        <span className={styles.rail}>
          <span className={styles.line} />
          <span className={`${styles.line} ${styles.short}`} />
          <span className={styles.line} />
        </span>
        <span className={styles.main}>
          {[0, 1].map((section) => (
            <span key={section} className={styles.section}>
              <span className={styles.heading} />
              <span className={styles.line} />
              <span className={styles.line} />
              <span className={`${styles.line} ${styles.short}`} />
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

export function TemplatePicker() {
  const { control } = useFormContext<ResumeContent>();
  const accent = useWatch({ control, name: "theme.accent" }) ?? DEFAULT_ACCENT;

  return (
    <SectionCard title="Template">
      <Controller
        name="template"
        control={control}
        render={({ field }) => (
          <div className={styles.grid} role="radiogroup" aria-label="Template">
            {TEMPLATES.map((template) => {
              const twoColumn = isTwoColumn(template);
              return (
                <label key={template} className={styles.option}>
                  <input
                    type="radio"
                    name="template-picker"
                    value={template}
                    checked={field.value === template}
                    onChange={() => field.onChange(template)}
                    className={styles.input}
                  />
                  <Miniature template={template} accent={accent} />
                  <span className={styles.name}>{TEMPLATE_LABELS[template]}</span>
                  <span
                    className={`font-mono ${styles.verdict}`}
                    data-warn={twoColumn || undefined}
                  >
                    <span>{twoColumn ? "⚠ 2-column" : "✓ 1-column"}</span>
                    <span>{twoColumn ? "may scramble parsing" : "ATS-safe"}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      />
    </SectionCard>
  );
}
