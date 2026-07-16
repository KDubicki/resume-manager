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
// migration is needed to add a template.
export const templateSchema = z.enum(["classic", "sidebar"]).default("classic");

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
});

export type ResumeTheme = z.infer<typeof themeSchema>;

export const resumeContentSchema = z.object({
  template: templateSchema,
  // Presentation accent (section headings + skill chips), used by both templates.
  // `.prefault({})` runs an empty object through the schema so `accent` gets its
  // default, instead of storing a literal `{}` with an undefined accent.
  theme: themeSchema.prefault({}),
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
export type ResumeTemplate = z.infer<typeof templateSchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;

export const defaultResumeContent: ResumeContent = resumeContentSchema.parse({});
