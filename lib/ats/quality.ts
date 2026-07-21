import type { ResumeContent } from "@/lib/schemas/resume";

// ATS-5: advisory quality checks surfaced in the ATS Lens. These are writing
// hints, not hard errors — each points at a concrete weakness a recruiter or
// parser would notice: an empty section, a bullet that doesn't lead with an
// action verb, an over-long paragraph, or a missing date. Kept conservative so
// a warning almost always reflects a real issue (few false positives).

export interface QualityWarning {
  key: string;
  message: string;
}

// Words that clearly aren't action verbs when they open a bullet. Deliberately
// small and precise — flagging only unambiguous non-verb / weak openers avoids
// nagging about legitimate verbs a whitelist would miss.
const WEAK_BULLET_STARTERS = new Set([
  "a",
  "an",
  "the",
  "i",
  "we",
  "my",
  "our",
  "responsible",
  "duties",
  "duty",
]);

// Word-count ceilings. A resume bullet past ~40 words has stopped being a bullet;
// a summary past ~120 words is a wall of text; a free-text description past ~80
// is drifting into essay territory.
const MAX_BULLET_WORDS = 40;
const MAX_SUMMARY_WORDS = 120;
const MAX_DESCRIPTION_WORDS = 80;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function firstWord(text: string): string {
  // Strip a leading bullet glyph / punctuation so "- Led ..." reads as "led".
  const cleaned = text.trim().replace(/^[-•*\d.)\s]+/, "");
  const match = cleaned.toLowerCase().match(/[a-z']+/);
  return match ? match[0] : "";
}

function snippet(text: string, max = 32): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
}

export function analyzeQuality(content: ResumeContent): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  // Summary length.
  const summaryWords = wordCount(content.summary);
  if (summaryWords > MAX_SUMMARY_WORDS) {
    warnings.push({
      key: "summary-long",
      message: `Summary is long (${summaryWords} words) — tighten it to a few lines.`,
    });
  }

  content.experience.forEach((entry, index) => {
    const label = entry.role || entry.company || `Experience ${index + 1}`;

    // Missing dates.
    if (!entry.startDate.trim()) {
      warnings.push({ key: `exp-${index}-start`, message: `${label} is missing a start date.` });
    }
    if (!entry.current && !entry.endDate.trim()) {
      warnings.push({ key: `exp-${index}-end`, message: `${label} is missing an end date.` });
    }

    // Empty section.
    if (entry.highlights.length === 0) {
      warnings.push({ key: `exp-${index}-empty`, message: `${label} has no bullet points.` });
    }

    entry.highlights.forEach((highlight, hi) => {
      if (WEAK_BULLET_STARTERS.has(firstWord(highlight))) {
        warnings.push({
          key: `exp-${index}-verb-${hi}`,
          message: `Bullet "${snippet(highlight)}" doesn't start with an action verb.`,
        });
      }
      if (wordCount(highlight) > MAX_BULLET_WORDS) {
        warnings.push({
          key: `exp-${index}-len-${hi}`,
          message: `Bullet "${snippet(highlight)}" is too long — split it up.`,
        });
      }
    });
  });

  content.education.forEach((entry, index) => {
    const label = entry.degree || entry.institution || `Education ${index + 1}`;
    if (!entry.startDate.trim()) {
      warnings.push({ key: `edu-${index}-start`, message: `${label} is missing a start date.` });
    }
    if (!entry.current && !entry.endDate.trim()) {
      warnings.push({ key: `edu-${index}-end`, message: `${label} is missing an end date.` });
    }
    if (wordCount(entry.description) > MAX_DESCRIPTION_WORDS) {
      warnings.push({ key: `edu-${index}-len`, message: `${label}'s description is very long.` });
    }
  });

  content.projects.forEach((entry, index) => {
    const label = entry.name || `Project ${index + 1}`;
    if (!entry.description.trim() && entry.highlights.length === 0) {
      warnings.push({
        key: `proj-${index}-empty`,
        message: `Project "${label}" has no description or highlights.`,
      });
    }
    if (wordCount(entry.description) > MAX_DESCRIPTION_WORDS) {
      warnings.push({
        key: `proj-${index}-len`,
        message: `Project "${label}"'s description is very long.`,
      });
    }
    entry.highlights.forEach((highlight, hi) => {
      if (WEAK_BULLET_STARTERS.has(firstWord(highlight))) {
        warnings.push({
          key: `proj-${index}-verb-${hi}`,
          message: `Bullet "${snippet(highlight)}" doesn't start with an action verb.`,
        });
      }
    });
  });

  content.skillGroups.forEach((group, index) => {
    if (group.skills.length === 0) {
      const label = group.category || `Skill group ${index + 1}`;
      warnings.push({
        key: `skill-${index}-empty`,
        message: `Skill group "${label}" has no skills.`,
      });
    }
  });

  return warnings;
}
