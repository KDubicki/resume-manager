import { describe, expect, it } from "vitest";

import { pdfFileName, pdfTitle } from "@/lib/export-name";
import { resumeContentSchema } from "@/lib/schemas/resume";

const withName = (fullName: string) => resumeContentSchema.parse({ contact: { fullName } });

describe("pdfTitle", () => {
  it("uses the candidate's name, not the internal resume title", () => {
    expect(pdfTitle("XTB - Data Engineer (v2)", withName("Kamil Dubicki"))).toBe(
      "Kamil Dubicki – Resume",
    );
  });

  it("falls back to the resume title when there is no name yet", () => {
    expect(pdfTitle("Draft", withName("  "))).toBe("Draft");
  });
});

describe("pdfFileName", () => {
  it("builds Name-Resume.pdf", () => {
    expect(pdfFileName("XTB - Data Engineer", withName("Kamil Dubicki"))).toBe(
      "Kamil-Dubicki-Resume.pdf",
    );
  });

  it("transliterates Polish and other accented letters instead of dropping them", () => {
    expect(pdfFileName("x", withName("Łukasz Żółć-Wąs"))).toBe("Lukasz-Zolc-Was-Resume.pdf");
    expect(pdfFileName("x", withName("Søren Groß"))).toBe("Soren-Gross-Resume.pdf");
  });

  it("falls back to the slugified title when there is no name", () => {
    expect(pdfFileName("My Resume", withName(""))).toBe("my-resume.pdf");
  });
});
