"use client";

import { ColorPicker, Segmented, Select } from "antd";
import { Controller, useFormContext } from "react-hook-form";

import {
  DEFAULT_ACCENT,
  DEFAULT_DENSITY,
  DEFAULT_FONT_FAMILY,
  DENSITIES,
  DENSITY_LABELS,
  FONT_FAMILIES,
  FONT_FAMILY_LABELS,
  type ResumeContent,
} from "@/lib/schemas/resume";

import styles from "./appearance-section.module.css";
import { SectionCard } from "./section-card";

// A small curated set so a click gets a tasteful accent; the picker still
// allows any custom hex.
const PRESETS = ["#2a6cf0", "#0f766e", "#b23a48", "#7c3aed", "#c2410c", "#1a1a1a"];

const FONT_OPTIONS = FONT_FAMILIES.map((family) => ({
  value: family,
  label: FONT_FAMILY_LABELS[family],
}));

const DENSITY_OPTIONS = DENSITIES.map((density) => ({
  value: density,
  label: DENSITY_LABELS[density],
}));

export function AppearanceSection() {
  const { control } = useFormContext<ResumeContent>();

  return (
    <SectionCard title="Appearance">
      <div className={styles.row}>
        <span className={styles.label}>Accent color</span>
        <Controller
          name="theme.accent"
          control={control}
          render={({ field }) => (
            <ColorPicker
              // Store a plain 6-digit hex string — that's exactly what the
              // schema validates and what both PDF templates read.
              value={field.value ?? DEFAULT_ACCENT}
              onChange={(color) => field.onChange(color.toHexString())}
              format="hex"
              disabledAlpha
              presets={[{ label: "Suggested", colors: PRESETS }]}
              aria-label="Accent color"
              showText
            />
          )}
        />
      </div>
      <p className={styles.note}>Tints section headings and skill chips in both templates.</p>

      <div className={styles.row}>
        <span className={styles.label}>Font</span>
        <Controller
          name="theme.fontFamily"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? DEFAULT_FONT_FAMILY}
              onChange={field.onChange}
              options={FONT_OPTIONS}
              aria-label="Font family"
              className={styles.fontSelect}
            />
          )}
        />
      </div>
      <p className={styles.note}>All options are embedded, ATS-safe typefaces.</p>

      <div className={styles.row}>
        <span className={styles.label}>Density</span>
        <Controller
          name="theme.density"
          control={control}
          render={({ field }) => (
            <Segmented
              value={field.value ?? DEFAULT_DENSITY}
              onChange={field.onChange}
              options={DENSITY_OPTIONS}
              aria-label="Text density"
            />
          )}
        />
      </div>
      <p className={styles.note}>Scales text size and spacing to fit more or less on the page.</p>
    </SectionCard>
  );
}
