"use client";

import { Switch } from "antd";
import { useFormContext, useWatch } from "react-hook-form";

import {
  TOGGLEABLE_SECTIONS,
  TOGGLEABLE_SECTION_LABELS,
  type ResumeContent,
  type ToggleableSection,
} from "@/lib/schemas/resume";

import styles from "./sections-visibility.module.css";
import { SectionCard } from "./section-card";

export function SectionsVisibility() {
  const { control, setValue } = useFormContext<ResumeContent>();
  // Persisted list of hidden keys; everything not in it is visible.
  const hidden = useWatch({ control, name: "hiddenSections" }) ?? [];
  const hiddenSet = new Set(hidden);

  // setValue drives the same form `watch` the editor already listens to, so a
  // toggle autosaves and refreshes the live preview with no extra wiring.
  const setVisible = (key: ToggleableSection, visible: boolean) => {
    const without = hidden.filter((k) => k !== key);
    setValue("hiddenSections", visible ? without : [...without, key], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <SectionCard title="Visible sections">
      <p className={styles.note}>Hide a section from the exported PDF without deleting its content.</p>
      <div className={styles.list}>
        {TOGGLEABLE_SECTIONS.map((key) => (
          <div key={key} className={styles.item}>
            <Switch
              size="small"
              checked={!hiddenSet.has(key)}
              onChange={(visible) => setVisible(key, visible)}
              aria-label={`Show ${TOGGLEABLE_SECTION_LABELS[key]} section`}
            />
            <span className={styles.itemLabel}>{TOGGLEABLE_SECTION_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
