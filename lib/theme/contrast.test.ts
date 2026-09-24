import { describe, expect, it } from "vitest";

import { DEFAULT_ACCENT } from "@/lib/schemas/resume";

import { contrastRatio, darkenToContrast, MIN_ACCENT_CONTRAST, PAPER } from "./contrast";

describe("contrastRatio", () => {
  it("matches the WCAG extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#2a6cf0", PAPER)).toBeCloseTo(contrastRatio(PAPER, "#2a6cf0"), 10);
  });

  it("passes the default accent on paper", () => {
    expect(contrastRatio(DEFAULT_ACCENT, PAPER)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
  });
});

describe("darkenToContrast", () => {
  it("leaves a passing color alone", () => {
    expect(darkenToContrast("#1A1A1A")).toBe("#1a1a1a");
  });

  it("darkens a pale color just enough to pass, keeping its hue", () => {
    const fixed = darkenToContrast("#ffd166");
    expect(contrastRatio(fixed, PAPER)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
    // Barely over the bar, not needlessly dark.
    expect(contrastRatio(fixed, PAPER)).toBeLessThan(MIN_ACCENT_CONTRAST + 0.5);
    // Still a yellow/amber: red channel dominates blue.
    const [r, , b] = [1, 3, 5].map((i) => Number.parseInt(fixed.slice(i, i + 2), 16));
    expect(r!).toBeGreaterThan(b!);
  });
});
