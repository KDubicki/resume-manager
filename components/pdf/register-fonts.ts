import { Font } from "@react-pdf/renderer";

const FONT_FILES = [
  { file: "Roboto-Regular.ttf", fontWeight: 400 as const, fontStyle: "normal" as const },
  { file: "Roboto-Bold.ttf", fontWeight: 700 as const, fontStyle: "normal" as const },
  { file: "Roboto-Italic.ttf", fontWeight: 400 as const, fontStyle: "italic" as const },
  { file: "Roboto-BoldItalic.ttf", fontWeight: 700 as const, fontStyle: "italic" as const },
];

let registered = false;

// Same font, two sources: the server-side export (Step 9) reads the TTFs
// straight off disk (no network dependency in the export path); the
// client-side live preview (Step 8) fetches them from /public over HTTP,
// since a browser bundle has no filesystem access.
export async function registerPdfFonts(): Promise<void> {
  if (registered) return;
  registered = true;

  const toSrc = async (file: string): Promise<string> => {
    if (typeof window === "undefined") {
      const { join } = await import("node:path");
      return join(process.cwd(), "public", "fonts", file);
    }
    return `/fonts/${file}`;
  };

  Font.register({
    family: "Roboto",
    fonts: await Promise.all(
      FONT_FILES.map(async ({ file, fontWeight, fontStyle }) => ({
        src: await toSrc(file),
        fontWeight,
        fontStyle,
      })),
    ),
  });
}
