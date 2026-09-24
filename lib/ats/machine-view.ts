import { SIDEBAR_SECTION_LABELS, TOGGLEABLE_SECTION_LABELS } from "@/lib/schemas/resume";

// The "machine side" of the paper: text extracted from the exported PDF, in
// the order a parser reads it, annotated with which lines a parser would take
// as section headings. Pure (no pdf.js here) so it can be unit-tested; the
// extraction itself lives in components/pdf/extract-pdf-text.ts.

// Every heading the templates print, plus the common synonyms ATS parsers
// match on. Compared case-insensitively against a whole line.
const HEADING_NAMES = new Set(
  [
    ...Object.values(SIDEBAR_SECTION_LABELS),
    ...Object.values(TOGGLEABLE_SECTION_LABELS),
    "Certifications & Courses",
    "Profile",
    "Professional Summary",
    "Work Experience",
    "Professional Experience",
    "Employment",
    "Technical Skills",
    "Courses",
  ].map((name) => name.toLowerCase()),
);

export function isSectionHeading(line: string): boolean {
  const normalized = line.trim().replace(/:$/, "").toLowerCase();
  return HEADING_NAMES.has(normalized);
}

export interface MachineLine {
  /** 1-based, continuous across pages — the order a parser consumes lines in. */
  number: number;
  page: number;
  text: string;
  heading: boolean;
}

export interface MachineView {
  lines: MachineLine[];
  pages: number;
  words: number;
  /** Recognised headings, in reading order, as printed. */
  sections: string[];
}

/** `pages[i]` holds page i+1's extracted lines, in extraction order. */
export function buildMachineView(pages: string[][]): MachineView {
  const lines: MachineLine[] = [];
  let words = 0;
  pages.forEach((pageLines, pageIndex) => {
    for (const raw of pageLines) {
      const text = raw.replace(/\s+/g, " ").trim();
      if (!text) continue;
      words += text.split(" ").length;
      lines.push({
        number: lines.length + 1,
        page: pageIndex + 1,
        text,
        heading: isSectionHeading(text),
      });
    }
  });
  return {
    lines,
    pages: pages.length,
    words,
    sections: lines.filter((line) => line.heading).map((line) => line.text),
  };
}
