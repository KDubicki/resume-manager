import type { ResumeContent } from "@/lib/schemas/resume";

// ATS-4: a plain "how filled-in is this resume" measure, separate from the ATS
// readiness score (ATS-3). Where the score weighs parsing risk and keyword fit,
// this is an authoring checklist — the handful of fields a resume needs before
// it's worth exporting at all. Shown on the dashboard card and live in the editor.

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

export interface Completeness {
  percent: number;
  completed: number;
  total: number;
  items: CompletenessItem[];
}

export function computeCompleteness(content: ResumeContent): Completeness {
  const c = content.contact;
  const items: CompletenessItem[] = [
    { key: "name", label: "Name", done: c.fullName.trim().length > 0 },
    {
      key: "contact",
      label: "Contact details",
      done: [c.email, c.phone, c.linkedin].some((field) => field.trim().length > 0),
    },
    { key: "summary", label: "Summary", done: content.summary.trim().length > 0 },
    { key: "experience", label: "Experience", done: content.experience.length > 0 },
    {
      key: "highlights",
      label: "Experience details",
      done: content.experience.some((entry) => entry.highlights.length > 0),
    },
    { key: "education", label: "Education", done: content.education.length > 0 },
    {
      key: "skills",
      label: "Skills",
      done: content.skillGroups.some((group) => group.skills.length > 0),
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const percent = Math.round((completed / items.length) * 100);
  return { percent, completed, total: items.length, items };
}
