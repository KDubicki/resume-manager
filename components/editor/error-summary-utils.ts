import type { FieldErrors } from "react-hook-form";

import { slugify } from "@/lib/slugify";

// Pure helpers behind the inline validation summary (UX-4), split out from the
// component so they can be unit tested without pulling in React/CSS.

export interface FlatError {
  name: string;
  message: string;
}

// Walk RHF's nested error tree into a flat list of { dotted-name, message }.
// A leaf error carries a string `message`; anything else is a group to recurse
// into (objects and array-of-entry errors alike, via their numeric keys).
export function flattenErrors(errors: FieldErrors, path = "", out: FlatError[] = []): FlatError[] {
  for (const key of Object.keys(errors)) {
    const value = (errors as Record<string, unknown>)[key];
    if (!value || typeof value !== "object") continue;
    const name = path ? `${path}.${key}` : key;
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message) {
      out.push({ name, message });
    } else {
      flattenErrors(value as FieldErrors, name, out);
    }
  }
  return out;
}

// Section titles for the error-producing list sections, so a jump can expand the
// right SectionCard (UX-2) before focusing. Kept in sync with each section's
// `title`, resolved through the same slugify the anchors use.
const SECTION_TITLE: Record<string, string> = {
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  languages: "Languages",
  certifications: "Certifications & Courses",
};

const SECTION_LABEL: Record<string, string> = {
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  languages: "Language",
  certifications: "Certification",
  contact: "Contact",
  summary: "Summary",
};

export function anchorFor(name: string): string | null {
  const prefix = name.split(".")[0] ?? "";
  const title = SECTION_TITLE[prefix];
  return title ? slugify(title) : null;
}

// "experience.2.company" -> "Experience 3". Falls back to the section label
// alone for non-indexed fields.
export function locate(name: string): string {
  const parts = name.split(".");
  const prefix = parts[0] ?? "";
  const label = SECTION_LABEL[prefix] ?? prefix;
  const index = parts[1];
  if (index && /^\d+$/.test(index)) return `${label} ${Number(index) + 1}`;
  return label;
}
