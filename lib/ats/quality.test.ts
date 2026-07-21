import { describe, expect, it } from "vitest";

import { resumeContentSchema, type ResumeContent } from "../schemas/resume";

import { analyzeQuality } from "./quality";

function content(overrides: Partial<ResumeContent> = {}): ResumeContent {
  return { ...resumeContentSchema.parse({}), ...overrides };
}

function experience(overrides: Partial<ResumeContent["experience"][number]> = {}) {
  return {
    id: "1",
    company: "Acme",
    role: "Engineer",
    location: "",
    startDate: "2020",
    endDate: "2022",
    current: false,
    highlights: ["Led the migration to Kubernetes"],
    ...overrides,
  };
}

describe("analyzeQuality", () => {
  it("returns no warnings for a clean resume", () => {
    const result = analyzeQuality(content({ experience: [experience()] }));
    expect(result).toEqual([]);
  });

  it("flags an experience entry with no bullet points", () => {
    const result = analyzeQuality(content({ experience: [experience({ highlights: [] })] }));
    expect(result.some((w) => w.message.includes("no bullet points"))).toBe(true);
  });

  it("flags a bullet that does not start with an action verb", () => {
    const result = analyzeQuality(
      content({ experience: [experience({ highlights: ["Responsible for the CI pipeline"] })] }),
    );
    expect(result.some((w) => w.message.includes("action verb"))).toBe(true);
  });

  it("does not flag a bullet that starts with an action verb", () => {
    const result = analyzeQuality(
      content({ experience: [experience({ highlights: ["Built the CI pipeline"] })] }),
    );
    expect(result.some((w) => w.message.includes("action verb"))).toBe(false);
  });

  it("flags a missing start date and a missing end date", () => {
    const result = analyzeQuality(
      content({ experience: [experience({ startDate: "", endDate: "", current: false })] }),
    );
    expect(result.some((w) => w.message.includes("missing a start date"))).toBe(true);
    expect(result.some((w) => w.message.includes("missing an end date"))).toBe(true);
  });

  it("does not ask for an end date on a current role", () => {
    const result = analyzeQuality(
      content({ experience: [experience({ endDate: "", current: true })] }),
    );
    expect(result.some((w) => w.message.includes("missing an end date"))).toBe(false);
  });

  it("flags an over-long summary", () => {
    const result = analyzeQuality(content({ summary: "word ".repeat(130) }));
    expect(result.some((w) => w.key === "summary-long")).toBe(true);
  });

  it("flags an over-long bullet", () => {
    const result = analyzeQuality(
      content({ experience: [experience({ highlights: [`Built ${"scale ".repeat(45)}`] })] }),
    );
    expect(result.some((w) => w.message.includes("too long"))).toBe(true);
  });

  it("flags a skill group with no skills", () => {
    const result = analyzeQuality(
      content({ skillGroups: [{ id: "s", category: "Backend", skills: [] }] }),
    );
    expect(result.some((w) => w.message.includes("no skills"))).toBe(true);
  });
});
