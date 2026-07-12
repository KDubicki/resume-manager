import { z } from "zod";

const entryId = z.string().default(() => crypto.randomUUID());

export const experienceEntrySchema = z.object({
  id: entryId,
  company: z.string().min(1, { error: "Company is required" }),
  role: z.string().min(1, { error: "Role is required" }),
  location: z.string().default(""),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  // Not `.min(1)` per element: the editor's "one highlight per line" textarea
  // naturally produces a blank line while the user is mid-typing a new
  // bullet (e.g. right after pressing Enter), and a single invalid entry
  // would previously fail validation for the WHOLE resume, silently
  // blocking autosave. Blank/whitespace-only lines are dropped here instead
  // of rejected, matching what resume-document.tsx already tolerates when
  // rendering (`highlights.filter(Boolean)`).
  highlights: z
    .array(z.string())
    .transform((lines) => lines.filter((line) => line.trim().length > 0))
    .default([]),
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

export const skillEntrySchema = z.object({
  id: entryId,
  name: z.string().min(1, { error: "Skill name is required" }),
});

export const resumeContentSchema = z.object({
  summary: z.string().max(2000).default(""),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: z.array(skillEntrySchema).default([]),
});

export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type SkillEntry = z.infer<typeof skillEntrySchema>;
export type ResumeContent = z.infer<typeof resumeContentSchema>;

export const defaultResumeContent: ResumeContent = resumeContentSchema.parse({});
