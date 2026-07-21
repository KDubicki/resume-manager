import { describe, expect, it } from "vitest";

import { resumeContentSchema, type ResumeContent } from "../schemas/resume";

import { scoreResume } from "./score";

function content(overrides: Partial<ResumeContent> = {}): ResumeContent {
  return { ...resumeContentSchema.parse({}), ...overrides };
}

// A reasonably complete resume: identity, contact, summary, and all three core
// list sections filled, with enough prose to land in the healthy length band.
function fullResume(overrides: Partial<ResumeContent> = {}): ResumeContent {
  const filler = "delivered scalable services and mentored engineers ".repeat(40);
  return content({
    contact: {
      fullName: "Ada Lovelace",
      headline: "Engineer",
      phone: "",
      email: "ada@example.com",
      linkedin: "",
      location: "London",
    },
    summary: `Senior backend engineer. ${filler}`,
    experience: [
      {
        id: "1",
        company: "Acme",
        role: "Engineer",
        location: "Remote",
        startDate: "2020",
        endDate: "",
        current: true,
        highlights: ["Built a Kafka pipeline"],
      },
    ],
    education: [
      {
        id: "2",
        institution: "MIT",
        degree: "BSc",
        fieldOfStudy: "CS",
        startDate: "2016",
        endDate: "2020",
        current: false,
        description: "",
      },
    ],
    skillGroups: [{ id: "3", category: "Backend", skills: ["PostgreSQL", "Kubernetes"] }],
    ...overrides,
  });
}

describe("scoreResume", () => {
  it("gives an empty resume a very low score", () => {
    // Only the reading-order check passes for an empty Classic doc (its layout
    // is genuinely linear), which sets the floor — everything else is 0.
    const result = scoreResume(content());
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("scores a complete single-column resume highly", () => {
    const result = scoreResume(fullResume());
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("marks keywords non-applicable when no job description is given", () => {
    const keywords = scoreResume(fullResume()).parts.find((p) => p.key === "keywords");
    expect(keywords?.applicable).toBe(false);
  });

  it("evaluates keywords once a job description is provided", () => {
    const jd = "Kubernetes Kubernetes PostgreSQL Terraform Terraform";
    const keywords = scoreResume(fullResume(), jd).parts.find((p) => p.key === "keywords");
    expect(keywords?.applicable).toBe(true);
    // PostgreSQL + Kubernetes are in the resume, Terraform is not → partial.
    expect(keywords?.ratio).toBeGreaterThan(0);
    expect(keywords?.ratio).toBeLessThan(1);
  });

  it("penalizes the two-column Sidebar template's reading order", () => {
    const classic = scoreResume(fullResume({ template: "classic" })).score;
    const sidebar = scoreResume(fullResume({ template: "sidebar" })).score;
    expect(sidebar).toBeLessThan(classic);
  });

  it("renormalizes weights so a missing JD does not cap the score at 75", () => {
    // With keywords excluded the three remaining parts are all near-perfect,
    // so the score should still be able to exceed 75.
    const result = scoreResume(fullResume());
    expect(result.score).toBeGreaterThan(75);
  });
});
