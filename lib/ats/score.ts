import type { ResumeContent } from "@/lib/schemas/resume";

import { matchKeywords, resumeToText } from "./keywords";

// ATS-3: a single 0–100 readiness score from four honest heuristics — how
// complete the sections are, whether the length is in a sane band, whether the
// reading order is ATS-safe (single vs. two column), and how well the resume
// echoes the target posting's keywords. Deliberately transparent and dependency
// free: every part is inspectable in `parts` so the UI can explain the number.

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Six presence checks covering the sections a parser expects to find. Experience
// carries no extra weight here beyond being one of the six — completeness, not
// prestige, is what this measures.
function sectionsRatio(content: ResumeContent): number {
  const c = content.contact;
  const checks = [
    c.fullName.trim().length > 0,
    [c.email, c.phone, c.linkedin].some((field) => field.trim().length > 0),
    content.summary.trim().length > 0,
    content.experience.length > 0,
    content.education.length > 0,
    content.skillGroups.length > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

// One page of dense resume text is roughly 350–850 words; inside that band is
// full marks. Shorter scales down linearly (a near-empty resume scores near 0);
// much longer is penalized but never to zero, since length alone isn't fatal.
function lengthRatio(wordCount: number): number {
  if (wordCount >= 350 && wordCount <= 850) return 1;
  if (wordCount < 350) return clamp(wordCount / 350, 0, 1);
  return clamp(1 - (wordCount - 850) / 1150, 0.3, 1);
}

// Classic is a clean single linear pass; the Sidebar's two columns can be
// interleaved by a parser (the same risk the ATS Lens already flags), so it
// keeps partial — not zero — credit.
function columnsRatio(content: ResumeContent): number {
  return content.template === "sidebar" ? 0.4 : 1;
}

export interface ScorePart {
  key: "sections" | "length" | "columns" | "keywords";
  label: string;
  ratio: number;
  weight: number;
  // Keywords can't be judged until a job description is pasted (ATS-1/ATS-2).
  // A non-applicable part is excluded and the remaining weights are renormalized
  // to 100, so the score is never artificially capped for a missing JD.
  applicable: boolean;
}

export interface AtsScore {
  score: number;
  parts: ScorePart[];
}

export function scoreResume(content: ResumeContent, jobDescription: string = ""): AtsScore {
  const wordCount = resumeToText(content).split(/\s+/).filter(Boolean).length;

  const hasJd = jobDescription.trim().length > 0;
  const keywords = hasJd ? matchKeywords(jobDescription, content) : null;
  const keywordsRatio =
    keywords && keywords.total > 0 ? keywords.matched.length / keywords.total : 0;

  const parts: ScorePart[] = [
    {
      key: "sections",
      label: "Sections",
      ratio: sectionsRatio(content),
      weight: 40,
      applicable: true,
    },
    { key: "length", label: "Length", ratio: lengthRatio(wordCount), weight: 20, applicable: true },
    {
      key: "columns",
      label: "Reading order",
      ratio: columnsRatio(content),
      weight: 15,
      applicable: true,
    },
    {
      key: "keywords",
      label: "Keywords",
      ratio: keywordsRatio,
      weight: 25,
      applicable: Boolean(keywords && keywords.total > 0),
    },
  ];

  const applicable = parts.filter((part) => part.applicable);
  const totalWeight = applicable.reduce((sum, part) => sum + part.weight, 0);
  const earned = applicable.reduce((sum, part) => sum + part.ratio * part.weight, 0);
  const score = totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100);

  return { score, parts };
}
