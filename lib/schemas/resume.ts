import { z } from "zod";

const entryId = z.string().default(() => crypto.randomUUID());

// Blank/whitespace-only lines are dropped rather than rejected. The editor's
// "one item per line" textareas naturally produce a transient blank line while
// the user is mid-typing (e.g. right after pressing Enter), and a single
// invalid element would otherwise fail validation for the WHOLE resume,
// silently blocking autosave. Matches what the templates tolerate when
// rendering (`.filter(Boolean)`).
const nonBlankLines = z
  .array(z.string())
  .transform((lines) => lines.filter((line) => line.trim().length > 0))
  .default([]);

export const experienceEntrySchema = z.object({
  id: entryId,
  company: z.string().min(1, { error: "Company is required" }),
  role: z.string().min(1, { error: "Role is required" }),
  location: z.string().default(""),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  highlights: nonBlankLines,
});

export const educationEntrySchema = z.object({
  id: entryId,
  institution: z.string().min(1, { error: "Institution is required" }),
  degree: z.string().min(1, { error: "Degree is required" }),
  fieldOfStudy: z.string().default(""),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  description: z.string().default(""),
});

export const projectEntrySchema = z.object({
  id: entryId,
  name: z.string().min(1, { error: "Project name is required" }),
  description: z.string().default(""),
  highlights: nonBlankLines,
});

export const languageEntrySchema = z.object({
  id: entryId,
  name: z.string().min(1, { error: "Language is required" }),
  proficiency: z.string().default(""),
});

export const certificationEntrySchema = z.object({
  id: entryId,
  name: z.string().min(1, { error: "Certification name is required" }),
});

// Skills are grouped by category (e.g. "Programming", "Networking") because
// both supported templates render them that way. Blank skill strings are
// dropped for the same mid-typing reason as `highlights`.
export const skillGroupSchema = z.object({
  id: entryId,
  category: z.string().default(""),
  skills: z
    .array(z.string())
    .transform((items) => items.filter((item) => item.trim().length > 0))
    .default([]),
});

// Header/contact block. All optional strings — a mid-typing autosave (e.g. a
// half-typed email) must never fail validation, so email is a plain string,
// not `.email()`.
export const contactSchema = z.object({
  fullName: z.string().default(""),
  headline: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  linkedin: z.string().default(""),
  location: z.string().default(""),
});

// Selects which PDF layout renders — stored inside `content` (not a Prisma
// column) so the one shared schema still owns the whole payload and no
// migration is needed to add a template. `classic`, `modern` and `minimal` are
// single-column (ATS-safe); `sidebar` is the one two-column layout.
export const templateSchema = z
  .enum(["classic", "modern", "minimal", "sidebar"])
  .default("classic");

export type ResumeTemplate = z.infer<typeof templateSchema>;

// Single source of the template display names + picker options, shared by the
// dashboard badges (app/page.tsx, app/trash/page.tsx) and the two pickers
// (editor contact-section, new-resume modal) so the labels never drift as
// templates are added.
export const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  minimal: "Minimal",
  sidebar: "Sidebar",
};

export const TEMPLATE_OPTIONS: { label: string; value: ResumeTemplate }[] = [
  { label: "Classic (1-column, ATS-safe)", value: "classic" },
  { label: "Modern (1-column, ATS-safe)", value: "modern" },
  { label: "Minimal (1-column, ATS-safe)", value: "minimal" },
  { label: "Sidebar (2-column)", value: "sidebar" },
];

// The single-column templates all share the classicOrder section sequence (see
// CLASSIC_SECTIONS) and single linear reading order; only `sidebar` splits the
// content into two columns.
export const SINGLE_COLUMN_TEMPLATES = ["classic", "modern", "minimal"] as const;

export function isSingleColumn(template: ResumeTemplate): boolean {
  return template !== "sidebar";
}

// The sections the Sidebar template can place in either column, and their
// display titles (shared by the PDF template and the layout editor so the two
// never drift).
export const SIDEBAR_SECTIONS = [
  "contact",
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "languages",
  "certifications",
  "interests",
] as const;

export type SidebarSectionKey = (typeof SIDEBAR_SECTIONS)[number];

export const SIDEBAR_SECTION_LABELS: Record<SidebarSectionKey, string> = {
  contact: "Contact",
  summary: "About Me",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  languages: "Languages",
  certifications: "Certificates",
  interests: "My Interests",
};

// Sections a user can hide without deleting their data (TP-4). `contact` is
// deliberately excluded — it's the header identity, always shown. A hidden
// section keeps its content in the blob and still appears in the editor; only
// the rendered PDF (both templates) skips it, so hiding is fully reversible.
export const TOGGLEABLE_SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "languages",
  "certifications",
  "interests",
] as const;

export type ToggleableSection = (typeof TOGGLEABLE_SECTIONS)[number];

// Editor-facing labels (neutral, unlike the Sidebar's stylized "About Me").
export const TOGGLEABLE_SECTION_LABELS: Record<ToggleableSection, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  languages: "Languages",
  certifications: "Certifications",
  interests: "Interests",
};

// Which column each Sidebar section lives in, and its order within that
// column. The defaults reproduce the reference two-column CV.
export const sidebarColumnsSchema = z.object({
  left: z.array(z.enum([...SIDEBAR_SECTIONS])).default([]),
  right: z.array(z.enum([...SIDEBAR_SECTIONS])).default([]),
});

export type SidebarColumns = z.infer<typeof sidebarColumnsSchema>;

export const DEFAULT_SIDEBAR_COLUMNS: SidebarColumns = {
  left: ["contact", "education", "interests", "certifications"],
  right: ["summary", "experience", "skills", "projects", "languages"],
};

// Guards against data loss: any section not yet assigned to a column (e.g. a
// resume saved before a new section existed) is appended to the right column
// so it still renders and still shows up in the layout editor.
export function normalizeSidebarColumns(columns: SidebarColumns): SidebarColumns {
  const placed = new Set<SidebarSectionKey>([...columns.left, ...columns.right]);
  const missing = SIDEBAR_SECTIONS.filter((key) => !placed.has(key));
  return { left: columns.left, right: [...columns.right, ...missing] };
}

// The sections the Classic (single-column) template renders, in their default
// top-to-bottom order. Contact is the header (always first) and interests is
// Sidebar-only, so neither is orderable here.
export const CLASSIC_SECTIONS = [
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "languages",
  "certifications",
] as const;

export type ClassicSectionKey = (typeof CLASSIC_SECTIONS)[number];

export const DEFAULT_CLASSIC_ORDER: ClassicSectionKey[] = [...CLASSIC_SECTIONS];

// Mirrors normalizeSidebarColumns: de-dupes and appends any section missing
// from a saved order (e.g. a resume written before a section existed) so it
// still renders and still appears in the ordering editor.
export function normalizeClassicOrder(order: ClassicSectionKey[]): ClassicSectionKey[] {
  const seen = new Set<ClassicSectionKey>();
  const deduped: ClassicSectionKey[] = [];
  for (const key of order) {
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(key);
    }
  }
  const missing = CLASSIC_SECTIONS.filter((key) => !seen.has(key));
  return [...deduped, ...missing];
}

// A single accent color (6-digit hex) applied to section headings and skill
// chips in both templates. `.catch` falls back to the default rather than
// failing validation, so a malformed value — e.g. a half-typed hex during a
// mid-edit autosave — never blocks a save or reaches the PDF renderer as an
// invalid color (which @react-pdf would throw on).
export const DEFAULT_ACCENT = "#2a6cf0";

// The selectable resume typefaces. All three are embedded (public/fonts) and
// ATS-safe — real text in a standard face, never rasterized. Each family ships
// the same four style slots (see register-fonts.ts). Adding a family here means
// adding its four `${Family}-${slot}.ttf` files; nothing else needs to change.
export const FONT_FAMILIES = ["Roboto", "Lato", "Tinos"] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];
export const DEFAULT_FONT_FAMILY: FontFamily = "Roboto";

// Human-readable labels for the font picker (kept next to the enum so the two
// never drift). Tinos is Times-metric-compatible, hence the note.
export const FONT_FAMILY_LABELS: Record<FontFamily, string> = {
  Roboto: "Roboto (sans-serif)",
  Lato: "Lato (sans-serif)",
  Tinos: "Tinos (serif)",
};

// Text density: scales font sizes and spacing in both templates so the same
// content can be tightened onto one page or opened up for readability. The
// numeric factors live with the templates (see scaleStyleSheet in
// templates/shared.tsx); this enum is just the selected level.
export const DENSITIES = ["compact", "normal", "relaxed"] as const;
export type Density = (typeof DENSITIES)[number];
export const DEFAULT_DENSITY: Density = "normal";

export const DENSITY_LABELS: Record<Density, string> = {
  compact: "Compact",
  normal: "Normal",
  relaxed: "Relaxed",
};

// Extra spacing controls layered on top of density (applied in scaleStyleSheet,
// templates/shared.tsx). Both are multipliers where 1 = the template's baseline:
// `sectionSpacing` scales the vertical gaps (margins) between sections/entries,
// `pageMargin` scales the page's outer padding. Ranges are shared with the
// editor's sliders so the two never drift.
export const DEFAULT_SECTION_SPACING = 1;
export const DEFAULT_PAGE_MARGIN = 1;
export const SECTION_SPACING_RANGE = { min: 0.6, max: 1.8, step: 0.1 } as const;
export const PAGE_MARGIN_RANGE = { min: 0.6, max: 1.6, step: 0.1 } as const;

// Two-column (Sidebar) template only: width of the LEFT column as a percentage;
// the right column fills the remainder (100 − this). Single-column templates
// ignore it.
export const DEFAULT_SIDEBAR_COLUMN_WIDTH = 34;
export const SIDEBAR_COLUMN_WIDTH_RANGE = { min: 20, max: 55, step: 1 } as const;

// How the Skills section is presented, applied by EVERY template (independent of
// the template choice): outlined chips or a compact inline "Category: a, b, c"
// line. Rendered by skillGroupNodes in templates/shared.tsx.
export const SKILLS_STYLES = ["chips", "inline"] as const;
export type SkillsStyle = (typeof SKILLS_STYLES)[number];
export const DEFAULT_SKILLS_STYLE: SkillsStyle = "chips";
export const SKILLS_STYLE_LABELS: Record<SkillsStyle, string> = {
  chips: "Outlined chips",
  inline: "Inline text",
};

export const themeSchema = z.object({
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .catch(DEFAULT_ACCENT)
    .default(DEFAULT_ACCENT),
  // `.catch` falls back to the default for any unknown value (e.g. a family
  // removed later), so an old blob never fails validation or renders in a font
  // that isn't registered.
  fontFamily: z.enum(FONT_FAMILIES).catch(DEFAULT_FONT_FAMILY).default(DEFAULT_FONT_FAMILY),
  density: z.enum(DENSITIES).catch(DEFAULT_DENSITY).default(DEFAULT_DENSITY),
  // Spacing multipliers. `.catch` falls back to the default for an out-of-range
  // or malformed value (e.g. a mid-edit autosave), so it never blocks a save or
  // reaches the renderer as NaN.
  sectionSpacing: z
    .number()
    .min(SECTION_SPACING_RANGE.min)
    .max(SECTION_SPACING_RANGE.max)
    .catch(DEFAULT_SECTION_SPACING)
    .default(DEFAULT_SECTION_SPACING),
  pageMargin: z
    .number()
    .min(PAGE_MARGIN_RANGE.min)
    .max(PAGE_MARGIN_RANGE.max)
    .catch(DEFAULT_PAGE_MARGIN)
    .default(DEFAULT_PAGE_MARGIN),
  sidebarColumnWidth: z
    .number()
    .min(SIDEBAR_COLUMN_WIDTH_RANGE.min)
    .max(SIDEBAR_COLUMN_WIDTH_RANGE.max)
    .catch(DEFAULT_SIDEBAR_COLUMN_WIDTH)
    .default(DEFAULT_SIDEBAR_COLUMN_WIDTH),
  skillsStyle: z.enum(SKILLS_STYLES).catch(DEFAULT_SKILLS_STYLE).default(DEFAULT_SKILLS_STYLE),
});

export type ResumeTheme = z.infer<typeof themeSchema>;

// The recommended defaults for every appearance setting, restored by the
// editor's "Recommended" reset button.
export const defaultTheme: ResumeTheme = themeSchema.parse({});

export const resumeContentSchema = z.object({
  template: templateSchema,
  // Presentation accent (section headings + skill chips), used by both templates.
  // `.prefault({})` runs an empty object through the schema so `accent` gets its
  // default, instead of storing a literal `{}` with an undefined accent.
  theme: themeSchema.prefault({}),
  // Sections the user has hidden (TP-4). Data for a hidden section is kept;
  // only the rendered PDF skips it. `.catch([])` drops the whole array if it's
  // malformed rather than failing the parse, so a bad value never blocks a save.
  hiddenSections: z.array(z.enum(TOGGLEABLE_SECTIONS)).catch([]).default([]),
  // Section order for the single-column templates (Classic/Modern/Minimal);
  // ignored by the Sidebar template. Malformed values `.catch([])` and are
  // backfilled to the full default order by normalizeClassicOrder at render time.
  classicOrder: z.array(z.enum(CLASSIC_SECTIONS)).catch([]).default(DEFAULT_CLASSIC_ORDER),
  // Sidebar-only: ignored by the Classic (single-column) template.
  sidebarColumns: sidebarColumnsSchema.default(DEFAULT_SIDEBAR_COLUMNS),
  // `.prefault` (not `.default`) so a missing `contact` is run through the
  // schema and its per-field defaults fill in — a plain `.default({})` would
  // store the literal `{}` and leave fullName/email/etc. undefined.
  contact: contactSchema.prefault({}),
  summary: z.string().max(2000).default(""),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
  skillGroups: z.array(skillGroupSchema).default([]),
  languages: z.array(languageEntrySchema).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
  interests: z.string().max(2000).default(""),
});

export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type LanguageEntry = z.infer<typeof languageEntrySchema>;
export type CertificationEntry = z.infer<typeof certificationEntrySchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;

export const defaultResumeContent: ResumeContent = resumeContentSchema.parse({});
