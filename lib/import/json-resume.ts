import { resumeContentSchema, type ResumeContent } from "@/lib/schemas/resume";

// Maps a JSON Resume document (https://jsonresume.org) into this app's resume
// content shape. The mapper is deliberately defensive: the input is an
// arbitrary uploaded file, so every field is read through the coercion helpers
// below and anything unrecognized is ignored rather than throwing. The result
// is a plain object meant to be handed to `resumeContentSchema` (which fills
// defaults, generates entry ids, and is the actual validation gate before the
// blob is ever persisted).
//
// JSON Resume sections without a home in this app (volunteer, awards,
// publications, references, meta, image) are intentionally dropped.

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asObjectArray(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonObject => item != null && typeof item === "object")
    : [];
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter((s) => s.trim().length > 0) : [];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// JSON Resume dates are ISO-ish: "YYYY", "YYYY-MM", or "YYYY-MM-DD". Render them
// the way a resume reads ("Mar 2024" / "2024"); anything unrecognized passes
// through unchanged so odd inputs are preserved rather than dropped.
function formatDate(value: unknown): string {
  const raw = asString(value).trim();
  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(raw);
  if (!match) return raw;
  const year = match[1] ?? raw;
  const month = match[2];
  if (month) {
    const name = MONTHS[Number(month) - 1];
    if (name) return `${name} ${year}`;
  }
  return year;
}

// A required-but-empty field would fail schema validation for the whole resume,
// so a kept entry that's missing an identifier gets a visible placeholder the
// user can fix in the editor — better than failing the entire import.
const PLACEHOLDER = "Unspecified";

function mapLinkedin(basics: JsonObject): string {
  const profiles = asObjectArray(basics.profiles);
  const linkedin = profiles.find((p) => asString(p.network).toLowerCase().includes("linkedin"));
  if (linkedin) return asString(linkedin.url) || asString(linkedin.username);
  return asString(basics.url);
}

function mapLocation(basics: JsonObject): string {
  const location = asObject(basics.location);
  const city = asString(location.city);
  const region = asString(location.region) || asString(location.countryCode);
  return [city, region].filter(Boolean).join(", ") || asString(location.address);
}

function mapWork(root: JsonObject): JsonObject[] {
  return asObjectArray(root.work)
    .map((entry) => ({
      company: asString(entry.name) || asString(entry.company),
      role: asString(entry.position) || asString(entry.role),
      location: asString(entry.location),
      startDate: formatDate(entry.startDate),
      endDate: formatDate(entry.endDate),
      summary: asString(entry.summary).trim(),
      highlights: asStringArray(entry.highlights),
    }))
    .filter((e) => e.company || e.role || e.summary || e.highlights.length)
    .map((e) => ({
      company: e.company || PLACEHOLDER,
      role: e.role || PLACEHOLDER,
      location: e.location,
      startDate: e.startDate || PLACEHOLDER,
      endDate: e.endDate,
      // JSON Resume leaves endDate empty for an ongoing role.
      current: e.startDate.length > 0 && e.endDate.length === 0,
      // No dedicated summary field here, so a work summary becomes the first
      // highlight rather than being lost.
      highlights: e.summary ? [e.summary, ...e.highlights] : e.highlights,
    }));
}

function mapEducation(root: JsonObject): JsonObject[] {
  return asObjectArray(root.education)
    .map((entry) => {
      const score = asString(entry.score);
      const courses = asStringArray(entry.courses);
      return {
        institution: asString(entry.institution),
        degree: asString(entry.studyType),
        area: asString(entry.area),
        startDate: formatDate(entry.startDate),
        endDate: formatDate(entry.endDate),
        description: [
          score ? `Score: ${score}` : "",
          courses.length ? `Courses: ${courses.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      };
    })
    .filter((e) => e.institution || e.degree || e.area)
    .map((e) => ({
      institution: e.institution || PLACEHOLDER,
      degree: e.degree || PLACEHOLDER,
      fieldOfStudy: e.area,
      startDate: e.startDate || PLACEHOLDER,
      endDate: e.endDate,
      current: e.startDate.length > 0 && e.endDate.length === 0,
      description: e.description,
    }));
}

function mapProjects(root: JsonObject): JsonObject[] {
  return asObjectArray(root.projects)
    .map((entry) => ({
      name: asString(entry.name),
      description: asString(entry.description),
      highlights: asStringArray(entry.highlights),
    }))
    .filter((entry) => entry.name || entry.description || entry.highlights.length)
    .map((entry) => ({ ...entry, name: entry.name || "Untitled project" }));
}

// JSON Resume skills are { name, keywords[] }: the name is the category and the
// keywords are the individual skills. Entries with no keywords are collected
// into one generic group so a bare list of skill names still comes through.
function mapSkillGroups(root: JsonObject): JsonObject[] {
  const groups: JsonObject[] = [];
  const loose: string[] = [];
  for (const skill of asObjectArray(root.skills)) {
    const name = asString(skill.name);
    const keywords = asStringArray(skill.keywords);
    if (keywords.length) groups.push({ category: name, skills: keywords });
    else if (name) loose.push(name);
  }
  if (loose.length) groups.push({ category: "Skills", skills: loose });
  return groups;
}

function mapLanguages(root: JsonObject): JsonObject[] {
  return asObjectArray(root.languages)
    .map((entry) => ({ name: asString(entry.language), proficiency: asString(entry.fluency) }))
    .filter((entry) => entry.name);
}

function mapCertifications(root: JsonObject): JsonObject[] {
  return asObjectArray(root.certificates)
    .map((entry) => {
      const name = asString(entry.name);
      const issuer = asString(entry.issuer);
      const date = formatDate(entry.date);
      const label = [name, issuer].filter(Boolean).join(" — ");
      return { name: date ? `${label} (${date})` : label };
    })
    .filter((entry) => entry.name);
}

function mapInterests(root: JsonObject): string {
  return asObjectArray(root.interests)
    .map((entry) => {
      const name = asString(entry.name);
      const keywords = asStringArray(entry.keywords);
      return keywords.length ? `${name}: ${keywords.join(", ")}` : name;
    })
    .filter(Boolean)
    .join("; ");
}

// The top-level keys a JSON Resume document is expected to carry. Used to warn
// the user early when an uploaded file clearly isn't JSON Resume, before the
// (otherwise-successful) mapping produces a near-empty resume.
const JSON_RESUME_KEYS = [
  "basics",
  "work",
  "education",
  "skills",
  "projects",
  "languages",
  "certificates",
  "volunteer",
  "awards",
  "interests",
];

export function isLikelyJsonResume(raw: unknown): boolean {
  const root = asObject(raw);
  return JSON_RESUME_KEYS.some((key) => key in root);
}

// Maps a parsed JSON Resume object to this app's content shape (pre-validation).
// Feed the result to `resumeContentSchema` to validate, fill defaults, and
// generate entry ids. `template`/`theme`/layout are left to the schema defaults
// (JSON Resume has no concept of them).
export function mapJsonResume(raw: unknown): Record<string, unknown> {
  const root = asObject(raw);
  const basics = asObject(root.basics);
  return {
    contact: {
      fullName: asString(basics.name),
      headline: asString(basics.label),
      phone: asString(basics.phone),
      email: asString(basics.email),
      linkedin: mapLinkedin(basics),
      location: mapLocation(basics),
    },
    summary: asString(basics.summary),
    experience: mapWork(root),
    education: mapEducation(root),
    projects: mapProjects(root),
    skillGroups: mapSkillGroups(root),
    languages: mapLanguages(root),
    certifications: mapCertifications(root),
    interests: mapInterests(root),
  };
}

export interface ImportPreview {
  content: ResumeContent;
  // Whether the payload looked like JSON Resume at all — false means the mapping
  // likely produced a near-empty resume and the UI should warn.
  likely: boolean;
  counts: {
    experience: number;
    education: number;
    projects: number;
    skills: number;
    languages: number;
    certifications: number;
  };
}

// Maps + validates a raw payload for the import UI's preview. Returns null only
// if the mapped result somehow fails schema validation (rare — the schema
// tolerates missing data); callers treat null as "couldn't read this file".
export function previewJsonResume(raw: unknown): ImportPreview | null {
  const parsed = resumeContentSchema.safeParse(mapJsonResume(raw));
  if (!parsed.success) return null;
  const content = parsed.data;
  return {
    content,
    likely: isLikelyJsonResume(raw),
    counts: {
      experience: content.experience.length,
      education: content.education.length,
      projects: content.projects.length,
      skills: content.skillGroups.length,
      languages: content.languages.length,
      certifications: content.certifications.length,
    },
  };
}
