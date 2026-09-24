// WCAG 2.x contrast helpers for the resume accent color. The accent tints
// section headings and chips on the PDF's white paper, so a pale pick (e.g.
// #FFD166) makes headings hard to read for a person and for OCR-based parsers.

/** The PDF paper every template renders on. */
export const PAPER = "#ffffff";

/** WCAG AA for normal text. Headings are small (~10–12 pt), so use the strict bar. */
export const MIN_ACCENT_CONTRAST = 4.5;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two #rrggbb colors, from 1 (none) to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function toHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * The same hue and saturation, darkened just enough to reach `min` contrast
 * on paper. Returns the input unchanged when it already passes.
 */
export function darkenToContrast(hex: string, min = MIN_ACCENT_CONTRAST): string {
  if (contrastRatio(hex, PAPER) >= min) return hex.toLowerCase();
  const [h, s, l] = toHsl(hex);
  for (let next = l; next >= 0; next -= 0.01) {
    const candidate = toHex(h, s, Math.max(0, next));
    if (contrastRatio(candidate, PAPER) >= min) return candidate;
  }
  return "#000000";
}
