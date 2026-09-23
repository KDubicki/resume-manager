import type { ResumeContent } from "@/lib/schemas/resume";
import { slugify } from "@/lib/slugify";

// The resume's `title` is the user's own label ("XTB - Data Engineer (v2)"),
// but the exported file travels: recruiters see its name and PDF title, and an
// ATS stores both. So those are built from the candidate's name instead, and
// the internal title is only a fallback for a resume with no name yet.

// Letters that NFD normalization doesn't decompose into base + accent.
const NON_DECOMPOSABLE: Record<string, string> = {
  ł: "l",
  Ł: "L",
  ø: "o",
  Ø: "O",
  đ: "d",
  Đ: "D",
  ß: "ss",
};

function asciiWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[łŁøØđĐß]/g, (char) => NON_DECOMPOSABLE[char] ?? char)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

/** PDF document title (shown in the viewer's title bar): "Jane Doe – Resume". */
export function pdfTitle(title: string, content: ResumeContent): string {
  const name = content.contact.fullName.trim();
  return name ? `${name} – Resume` : title;
}

/** Download file name: "Jane-Doe-Resume.pdf", ASCII-only so every system keeps it. */
export function pdfFileName(title: string, content: ResumeContent): string {
  const words = asciiWords(content.contact.fullName);
  return words.length > 0 ? `${words.join("-")}-Resume.pdf` : `${slugify(title)}.pdf`;
}
