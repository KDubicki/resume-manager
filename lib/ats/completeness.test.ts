import { describe, expect, it } from "vitest";

import { resumeContentSchema, type ResumeContent } from "../schemas/resume";

import { computeCompleteness } from "./completeness";

function content(overrides: Partial<ResumeContent> = {}): ResumeContent {
  return { ...resumeContentSchema.parse({}), ...overrides };
}

describe("computeCompleteness", () => {
  it("is 0% for an empty resume", () => {
    const result = computeCompleteness(content());
    expect(result.percent).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.items.every((item) => !item.done)).toBe(true);
  });

  it("counts each filled field toward the percentage", () => {
    const result = computeCompleteness(
      content({
        contact: {
          fullName: "Ada Lovelace",
          headline: "",
          phone: "",
          email: "ada@example.com",
          linkedin: "",
          location: "",
        },
        summary: "Engineer",
      }),
    );

    expect(result.items.find((i) => i.key === "name")?.done).toBe(true);
    expect(result.items.find((i) => i.key === "contact")?.done).toBe(true);
    expect(result.items.find((i) => i.key === "summary")?.done).toBe(true);
    // 3 of 7 filled → 43%
    expect(result.completed).toBe(3);
    expect(result.percent).toBe(43);
  });

  it("treats an experience entry without highlights as incomplete details", () => {
    const result = computeCompleteness(
      content({
        experience: [
          {
            id: "1",
            company: "Acme",
            role: "Engineer",
            location: "",
            startDate: "2020",
            endDate: "",
            current: true,
            highlights: [],
          },
        ],
      }),
    );

    expect(result.items.find((i) => i.key === "experience")?.done).toBe(true);
    expect(result.items.find((i) => i.key === "highlights")?.done).toBe(false);
  });

  it("is 100% when every tracked field is filled", () => {
    const result = computeCompleteness(
      content({
        contact: {
          fullName: "Ada Lovelace",
          headline: "",
          phone: "+1",
          email: "",
          linkedin: "",
          location: "",
        },
        summary: "Engineer",
        experience: [
          {
            id: "1",
            company: "Acme",
            role: "Engineer",
            location: "",
            startDate: "2020",
            endDate: "",
            current: true,
            highlights: ["Shipped things"],
          },
        ],
        education: [
          {
            id: "2",
            institution: "MIT",
            degree: "BSc",
            fieldOfStudy: "",
            startDate: "2016",
            endDate: "2020",
            current: false,
            description: "",
          },
        ],
        skillGroups: [{ id: "3", category: "Backend", skills: ["Go"] }],
      }),
    );

    expect(result.percent).toBe(100);
    expect(result.completed).toBe(result.total);
  });
});
