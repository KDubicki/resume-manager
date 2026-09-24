"use client";

import { Button, ColorPicker, Segmented, Select, Slider } from "antd";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  DEFAULT_ACCENT,
  DEFAULT_DENSITY,
  DEFAULT_FONT_FAMILY,
  DEFAULT_PAGE_MARGIN,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SECTION_SPACING,
  DEFAULT_SIDEBAR_COLUMN_WIDTH,
  DENSITIES,
  DENSITY_LABELS,
  FONT_FAMILIES,
  FONT_FAMILY_LABELS,
  PAGE_MARGIN_RANGE,
  PAGE_SIZE_LABELS,
  PAGE_SIZES,
  SECTION_SPACING_RANGE,
  SIDEBAR_COLUMN_WIDTH_RANGE,
  defaultTheme,
  type ResumeContent,
} from "@/lib/schemas/resume";
import {
  contrastRatio,
  darkenToContrast,
  MIN_ACCENT_CONTRAST,
  PAPER,
} from "@/lib/theme/contrast";

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

const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((size) => ({
  value: size,
  label: PAGE_SIZE_LABELS[size],
}));

const factorTip = (value?: number) => `${(value ?? 1).toFixed(1)}×`;

export function AppearanceSection() {
  const { control, getValues, setValue } = useFormContext<ResumeContent>();
  const template = useWatch({ control, name: "template" });
  const sidebarWidth = useWatch({ control, name: "theme.sidebarColumnWidth" });
  const accent = useWatch({ control, name: "theme.accent" }) ?? DEFAULT_ACCENT;
  // The accent is heading text on white paper: flag picks a reader (or an
  // OCR-based parser) would struggle with, and offer the nearest color that
  // passes, same hue, just darker.
  const accentContrast = contrastRatio(accent, PAPER);
  const lowContrast = accentContrast < MIN_ACCENT_CONTRAST;

  // Restore every appearance setting to its recommended default in one shot —
  // except the page size, which follows where the resume is sent, not taste.
  const resetToRecommended = () =>
    setValue(
      "theme",
      { ...defaultTheme, pageSize: getValues("theme.pageSize") ?? DEFAULT_PAGE_SIZE },
      { shouldDirty: true, shouldTouch: true },
    );

  return (
    <SectionCard
      title="Appearance"
      extra={
        <Button
          size="small"
          onClick={(event) => {
            // Don't let the click bubble to the collapse header and toggle it.
            event.stopPropagation();
            resetToRecommended();
          }}
        >
          Recommended (reset)
        </Button>
      }
    >
      <div className={styles.row}>
        <span className={styles.label}>Page size</span>
        <Controller
          name="theme.pageSize"
          control={control}
          render={({ field }) => (
            <Segmented
              value={field.value ?? DEFAULT_PAGE_SIZE}
              onChange={field.onChange}
              options={PAGE_SIZE_OPTIONS}
              aria-label="Page size"
            />
          )}
        />
      </div>
      <p className={styles.note}>
        US and Canadian employers expect US Letter; most other countries use A4.
      </p>

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
      <p className={styles.note}>Tints section headings and skill chips in every template.</p>
      {lowContrast ? (
        <div className={styles.contrastWarning} role="status">
          <span>
            Low contrast on paper ({accentContrast.toFixed(1)}:1). Headings may be hard to read;
            aim for at least {MIN_ACCENT_CONTRAST}:1.
          </span>
          <Button
            size="small"
            onClick={() =>
              setValue("theme.accent", darkenToContrast(accent), {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
          >
            Darken to pass
          </Button>
        </div>
      ) : null}

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

      <div className={styles.field}>
        <span className={styles.label}>Section spacing</span>
        <Controller
          name="theme.sectionSpacing"
          control={control}
          render={({ field }) => (
            <Slider
              className={styles.slider}
              min={SECTION_SPACING_RANGE.min}
              max={SECTION_SPACING_RANGE.max}
              step={SECTION_SPACING_RANGE.step}
              value={field.value ?? DEFAULT_SECTION_SPACING}
              onChange={field.onChange}
              marks={{ 1: "Default" }}
              tooltip={{ formatter: factorTip }}
              aria-label="Section spacing"
            />
          )}
        />
      </div>
      <p className={styles.note}>
        Vertical gap (margins) between sections and entries — left for tighter, right for looser.
      </p>

      <div className={styles.field}>
        <span className={styles.label}>Page margins</span>
        <Controller
          name="theme.pageMargin"
          control={control}
          render={({ field }) => (
            <Slider
              className={styles.slider}
              min={PAGE_MARGIN_RANGE.min}
              max={PAGE_MARGIN_RANGE.max}
              step={PAGE_MARGIN_RANGE.step}
              value={field.value ?? DEFAULT_PAGE_MARGIN}
              onChange={field.onChange}
              marks={{ 1: "Default" }}
              tooltip={{ formatter: factorTip }}
              aria-label="Page margins"
            />
          )}
        />
      </div>
      <p className={styles.note}>Padding around the page content — left for narrower, right for wider.</p>

      {template === "sidebar" ? (
        <>
          <div className={styles.field}>
            <span className={styles.label}>
              Column split — left {sidebarWidth ?? DEFAULT_SIDEBAR_COLUMN_WIDTH}% · right{" "}
              {100 - (sidebarWidth ?? DEFAULT_SIDEBAR_COLUMN_WIDTH)}%
            </span>
            <Controller
              name="theme.sidebarColumnWidth"
              control={control}
              render={({ field }) => (
                <Slider
                  className={styles.slider}
                  min={SIDEBAR_COLUMN_WIDTH_RANGE.min}
                  max={SIDEBAR_COLUMN_WIDTH_RANGE.max}
                  step={SIDEBAR_COLUMN_WIDTH_RANGE.step}
                  value={field.value ?? DEFAULT_SIDEBAR_COLUMN_WIDTH}
                  onChange={field.onChange}
                  marks={{ [DEFAULT_SIDEBAR_COLUMN_WIDTH]: "Default" }}
                  tooltip={{ formatter: (v?: number) => `${v ?? DEFAULT_SIDEBAR_COLUMN_WIDTH}%` }}
                  aria-label="Sidebar column width"
                />
              )}
            />
          </div>
          <p className={styles.note}>Width of the two columns in the Sidebar template.</p>
        </>
      ) : null}
    </SectionCard>
  );
}
