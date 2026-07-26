import { Text, View } from "@react-pdf/renderer";
import type { ComponentProps, ReactNode } from "react";

import type { Contact, Density, SkillGroup, SkillsStyle } from "@/lib/schemas/resume";

// A single @react-pdf style object, derived from View's own `style` prop type so
// we don't depend on @react-pdf/types resolving under pnpm's nesting. The prop
// is `Style | Style[] | undefined`; we unwrap it to one `Style` (via a generic
// so the conditional distributes over the union) so these can be safely composed
// inside style arrays, e.g. [base, { color: accent }].
type ArrayElement<T> = T extends ReadonlyArray<infer U> ? U : T;
type PdfStyle = ArrayElement<NonNullable<ComponentProps<typeof View>["style"]>>;

// How much each density level scales font sizes and spacing. `normal` is the
// unscaled reference (factor 1); compact tightens, relaxed opens up.
const DENSITY_FACTORS: Record<Density, number> = {
  compact: 0.85,
  normal: 1,
  relaxed: 1.15,
};

// Margin/gap props take the section-spacing multiplier; padding props take the
// page-margin multiplier. fontSize takes neither (only density scales it).
const MARGIN_PROPS = new Set([
  "marginTop",
  "marginBottom",
  "marginVertical",
  "marginHorizontal",
  "marginLeft",
  "marginRight",
  "gap",
]);
const PADDING_PROPS = new Set([
  "paddingTop",
  "paddingBottom",
  "paddingVertical",
  "paddingHorizontal",
  "paddingLeft",
  "paddingRight",
]);

// Only size/spacing props are scaled. Ratios (lineHeight), rules (borderWidth),
// corner radii, fixed rail widths and letter-spacing are left crisp so density
// changes overall size + whitespace without distorting proportions.
const SCALED_PROPS = new Set<string>(["fontSize", ...MARGIN_PROPS, ...PADDING_PROPS]);

// Optional per-family spacing multipliers layered on top of density: `margin`
// (the section-spacing control) scales vertical gaps between sections/entries;
// `padding` (the page-margin control) scales the page's outer padding. Both
// default to 1 (no extra scaling).
export interface SpacingFactors {
  margin?: number;
  padding?: number;
}

// Returns a copy of a StyleSheet with size/spacing values multiplied by the
// density factor, and margins/paddings additionally by the spacing factors.
// Non-numeric values (e.g. the sidebar's "34%" width) and non-scaled props pass
// through untouched. Cheap enough to run per render.
export function scaleStyleSheet<T extends Record<string, Record<string, unknown>>>(
  styles: T,
  density: Density,
  spacing: SpacingFactors = {},
): T {
  const densityFactor = DENSITY_FACTORS[density];
  const marginFactor = spacing.margin ?? 1;
  const paddingFactor = spacing.padding ?? 1;
  if (densityFactor === 1 && marginFactor === 1 && paddingFactor === 1) return styles;
  const out: Record<string, Record<string, unknown>> = {};
  for (const [name, style] of Object.entries(styles)) {
    const next: Record<string, unknown> = {};
    for (const [prop, value] of Object.entries(style)) {
      if (typeof value === "number" && SCALED_PROPS.has(prop)) {
        let scaled = value * densityFactor;
        if (MARGIN_PROPS.has(prop)) scaled *= marginFactor;
        else if (PADDING_PROPS.has(prop)) scaled *= paddingFactor;
        next[prop] = Math.round(scaled * 100) / 100;
      } else {
        next[prop] = value;
      }
    }
    out[name] = next;
  }
  return out as T;
}

// A resume date range. `current` overrides any endDate with "Present"; an
// empty endDate on a non-current entry renders as an em dash rather than a
// dangling separator.
export function formatRange(startDate: string, endDate: string, current: boolean): string {
  const endLabel = current ? "Present" : endDate || "—";
  return `${startDate} – ${endLabel}`;
}

// The single source of the resume's display name: an explicit contact name
// wins, but a freshly-created resume that only has a title still renders
// something sensible in the header.
export function displayName(contact: Contact, title: string): string {
  return contact.fullName.trim() || title;
}

// Strips the protocol, a leading "www.", and any trailing slash from a URL so a
// long link like "https://www.linkedin.com/in/foo/" reads as
// "linkedin.com/in/foo". Plain (non-URL) text passes through unchanged.
export function prettyUrl(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

// The contact line (phone · email · linkedin · location), skipping blanks so
// there are never orphaned separators. The LinkedIn URL is prettified so a full
// "https://www.…" link doesn't dominate the line.
export function contactParts(contact: Contact): string[] {
  return [contact.phone, contact.email, prettyUrl(contact.linkedin), contact.location]
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

// A bulleted list rendered as real Text rows (never a rasterized glyph list),
// so an ATS parser reads each highlight as plain text.
export function BulletList({
  items,
  styles,
}: {
  items: string[];
  styles: { bullet: PdfStyle; bulletDot: PdfStyle; bulletText: PdfStyle };
}) {
  return (
    <>
      {items.filter(Boolean).map((line, index) => (
        <View key={index} style={styles.bullet}>
          <Text style={styles.bulletDot}>{"•"}</Text>
          <Text style={styles.bulletText}>{line}</Text>
        </View>
      ))}
    </>
  );
}

// Style contract every template supplies so the shared skills renderer can lay
// the section out in any of the three presentations. `chip` is the base box
// (no border/fill — those are applied per style); `skillInline`/`skillInlineLabel`
// drive the compact "Category: a, b, c" line.
export interface SkillStyles {
  skillGroup: PdfStyle;
  skillGroupLabel: PdfStyle;
  skillInline: PdfStyle;
  skillInlineLabel: PdfStyle;
  chipRow: PdfStyle;
  chip: PdfStyle;
}

// Renders the Skills section in the user-chosen presentation (theme.skillsStyle),
// identically across every template. Returns an array of per-group nodes (not a
// fragment) so a caller like Classic's <Section> can still glue the heading to
// the first group and paginate the rest. `chips` = outlined accent boxes,
// `inline` = a compact comma-separated line.
export function skillGroupNodes(
  groups: SkillGroup[],
  mode: SkillsStyle,
  accent: string,
  styles: SkillStyles,
): ReactNode[] {
  return groups.map((group) => {
    const hasCategory = group.category.trim().length > 0;
    return (
      <View key={group.id} style={styles.skillGroup} wrap={false}>
        {mode === "inline" ? (
          <Text style={styles.skillInline}>
            {hasCategory ? (
              <Text style={[styles.skillInlineLabel, { color: accent }]}>{group.category}: </Text>
            ) : null}
            {group.skills.join(", ")}
          </Text>
        ) : (
          <>
            {hasCategory ? (
              <Text style={[styles.skillGroupLabel, { color: accent }]}>{group.category}</Text>
            ) : null}
            <View style={styles.chipRow}>
              {group.skills.map((skill, index) => (
                <Text
                  key={index}
                  style={[styles.chip, { borderWidth: 1, borderColor: accent, color: accent }]}
                >
                  {skill}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>
    );
  });
}

// Groups consecutive experience entries that share a company so the Classic
// template can print "Allegro | 2024–Present" once above its several roles,
// matching how the reference CV reads. Consecutive (not global) grouping keeps
// chronological order intact if the same employer recurs later.
export function groupByCompany<T extends { company: string }>(entries: T[]): { company: string; entries: T[] }[] {
  const groups: { company: string; entries: T[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.company === entry.company) {
      last.entries.push(entry);
    } else {
      groups.push({ company: entry.company, entries: [entry] });
    }
  }
  return groups;
}
