import { Font } from "@react-pdf/renderer";

import { FONT_FAMILIES } from "@/lib/schemas/resume";

// The four style slots every selectable family ships, mapped to the
// `${Family}-${slot}.ttf` files in public/fonts. Adding a family to
// FONT_FAMILIES (+ its four files) is all it takes to make it selectable.
const STYLE_SLOTS = [
  { slot: "Regular", fontWeight: 400 as const, fontStyle: "normal" as const },
  { slot: "Bold", fontWeight: 700 as const, fontStyle: "normal" as const },
  { slot: "Italic", fontWeight: 400 as const, fontStyle: "italic" as const },
  { slot: "BoldItalic", fontWeight: 700 as const, fontStyle: "italic" as const },
];

// Caches the in-flight/completed registration *promise* itself (not a
// boolean flag): a boolean set synchronously before the async work
// completed let a second concurrent caller (e.g. two overlapping export
// requests in the same warm process) proceed as if fonts were ready when
// they weren't, and left no way to recover if the work ever threw. Caching
// the promise means every caller — concurrent or later — awaits the exact
// same registration attempt, and a rejection clears the cache so the next
// call can retry instead of being locked out forever.
let registrationPromise: Promise<void> | null = null;

async function toSrc(file: string): Promise<string> {
  if (typeof window === "undefined") {
    const { join } = await import("node:path");
    return join(process.cwd(), "public", "fonts", file);
  }
  return `/fonts/${file}`;
}

async function doRegister(): Promise<void> {
  // @react-pdf hyphenates aggressively by default, breaking words mid-syllable
  // with a trailing hyphen ("Poznan University of Technology-", "Infor-mation",
  // "Technolo-gy"). That reads badly for a human and can even split a token for
  // an ATS parser. Returning each word as a single chunk removes the break
  // opportunities inside words, so lines wrap at spaces and whole words move to
  // the next line instead. react-pdf still hard-breaks a word that is genuinely
  // wider than its column, so a long URL/email can't overflow the page.
  Font.registerHyphenationCallback((word) => [word]);

  await Promise.all(
    FONT_FAMILIES.map(async (family) => {
      Font.register({
        family,
        fonts: await Promise.all(
          STYLE_SLOTS.map(async ({ slot, fontWeight, fontStyle }) => ({
            src: await toSrc(`${family}-${slot}.ttf`),
            fontWeight,
            fontStyle,
          })),
        ),
      });
    }),
  );
}

// Same font, two sources: the server-side export (Step 9) reads the TTFs
// straight off disk (no network dependency in the export path); the
// client-side live preview (Step 8) fetches them from /public over HTTP,
// since a browser bundle has no filesystem access.
export function registerPdfFonts(): Promise<void> {
  if (!registrationPromise) {
    registrationPromise = doRegister().catch((error: unknown) => {
      registrationPromise = null;
      throw error;
    });
  }
  return registrationPromise;
}
