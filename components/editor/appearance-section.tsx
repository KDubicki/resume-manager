"use client";

import { ColorPicker } from "antd";
import { Controller, useFormContext } from "react-hook-form";

import { DEFAULT_ACCENT, type ResumeContent } from "@/lib/schemas/resume";

import styles from "./appearance-section.module.css";
import { SectionCard } from "./section-card";

// A small curated set so a click gets a tasteful accent; the picker still
// allows any custom hex.
const PRESETS = ["#2a6cf0", "#0f766e", "#b23a48", "#7c3aed", "#c2410c", "#1a1a1a"];

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
    </SectionCard>
  );
}
