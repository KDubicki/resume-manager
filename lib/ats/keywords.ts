import type { ResumeContent } from "@/lib/schemas/resume";

// Deliberately no external NLP dependency (see ATS-2 in FEATURE_PROPOSALS.md):
// a job description is tokenized, stripped of function words, and its terms are
// checked for presence in the resume text. The goal is an honest "what the
// posting asks for that your resume doesn't mention yet" signal, not linguistic
// perfection.

// Function words + resume/JD boilerplate that carry no matching signal. Kept
// intentionally lean: over-filtering would drop real domain terms, which is the
// opposite of what this feature is for.
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "by",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "may",
  "might",
  "must",
  "not",
  "of",
  "on",
  "or",
  "our",
  "should",
  "so",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "to",
  "up",
  "us",
  "was",
  "we",
  "were",
  "what",
  "when",
  "which",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  // JD/resume boilerplate — ubiquitous framing words, not the skills a posting
  // is actually screening for.
  "ability",
  "able",
  "across",
  "also",
  "any",
  "based",
  "candidate",
  "etc",
  "experience",
  "including",
  "job",
  "join",
  "knowledge",
  "looking",
  "more",
  "new",
  "other",
  "per",
  "plus",
  "position",
  "preferred",
  "required",
  "requirements",
  "responsibilities",
  "role",
  "skills",
  "strong",
  "team",
  "using",
  "well",
  "work",
  "working",
  "years",
]);

// Splits on anything that isn't a word char or one of the symbols that are load
// bearing in tech terms (c++, c#, node.js, ci/cd, .net). Leading/trailing dots
// and slashes left by the split are trimmed so ".net" and "node.js" survive but
// a trailing sentence period doesn't fuse onto a word.
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#./]+/)
    .map((token) => token.replace(/^[./]+|[./]+$/g, ""))
    .filter(Boolean);
}

function isKeyword(token: string): boolean {
  if (token.length < 2) return false; // single chars are too noisy to match on
  if (/^\d+$/.test(token)) return false; // bare numbers (years, counts)
  return !STOPWORDS.has(token);
}

export interface RankedKeyword {
  term: string;
  count: number;
}

// Unique keywords ranked by frequency (ties broken alphabetically). Frequency
// is a cheap proxy for importance: a term the posting repeats is one it cares
// about.
export function extractKeywords(text: string): RankedKeyword[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (!isKeyword(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}

// Flattens every piece of user-authored resume text into one searchable blob.
// Presentation-only fields (dates, template, theme) are excluded — they can't
// carry keywords. All sections are included regardless of hidden state, mirroring
// how the ATS Lens's section count already treats the whole `content`.
export function resumeToText(content: ResumeContent): string {
  const parts: string[] = [
    content.contact.fullName,
    content.contact.headline,
    content.contact.location,
    content.summary,
    content.interests,
  ];
  for (const e of content.experience) {
    parts.push(e.company, e.role, e.location, ...e.highlights);
  }
  for (const ed of content.education) {
    parts.push(ed.institution, ed.degree, ed.fieldOfStudy, ed.description);
  }
  for (const p of content.projects) {
    parts.push(p.name, p.description, ...p.highlights);
  }
  for (const g of content.skillGroups) {
    parts.push(g.category, ...g.skills);
  }
  for (const l of content.languages) {
    parts.push(l.name, l.proficiency);
  }
  for (const cert of content.certifications) {
    parts.push(cert.name);
  }
  return parts.join(" ");
}

export interface KeywordMatch {
  matched: string[];
  missing: string[];
  total: number;
}

// Top JD keywords are considered only up to `limit` — a long posting can yield
// hundreds of tokens, but its most-repeated terms are the ones a screener keys
// on, and a shorter list keeps the "missing" guidance actionable.
const DEFAULT_LIMIT = 40;

export function matchKeywords(
  jobDescription: string,
  content: ResumeContent,
  limit: number = DEFAULT_LIMIT,
): KeywordMatch {
  const jdKeywords = extractKeywords(jobDescription).slice(0, limit);
  const resumeTokens = new Set(tokenize(resumeToText(content)));

  const matched: string[] = [];
  const missing: string[] = [];
  for (const { term } of jdKeywords) {
    if (resumeTokens.has(term)) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }
  return { matched, missing, total: jdKeywords.length };
}
