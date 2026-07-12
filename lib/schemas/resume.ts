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
  highlights: z.array(z.string().min(1)).default([]),
});

export const educationEntrySchema = z.object({
  id: entryId,
  institution: z.string().min(1, { error: "Institution is required" }),
  degree: z.string().min(1, { error: "Degree is required" }),
  fieldOfStudy: z.string().default(""),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().default(""),
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
