import { Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";

import type { Contact } from "@/lib/schemas/resume";

// The style shape @react-pdf accepts, taken straight from View's own prop type
// so we don't depend on @react-pdf/types resolving under pnpm's nesting.
type PdfStyle = ComponentProps<typeof View>["style"];

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

// The contact line (phone · email · linkedin · location), skipping blanks so
// there are never orphaned separators.
export function contactParts(contact: Contact): string[] {
  return [contact.phone, contact.email, contact.linkedin, contact.location]
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
