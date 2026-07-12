import { describe, expect, it } from "vitest";

import { defaultResumeContent, resumeContentSchema } from "./resume";

describe("resumeContentSchema", () => {
  it("fills in defaults for an empty payload", () => {
    const result = resumeContentSchema.parse({});

    expect(result).toEqual({
      summary: "",
      experience: [],
      education: [],
      skills: [],
    });
    expect(defaultResumeContent).toEqual(result);
  });

  it("accepts a fully populated, valid payload", () => {
    const payload = {
      summary: "Backend engineer focused on reliability.",
      experience: [
        {
          company: "Acme Corp",
          role: "Senior Engineer",
          startDate: "2021-01",
          endDate: "2024-06",
          highlights: ["Led the migration to Postgres", "Cut p95 latency by 40%"],
        },
      ],
      education: [
        {
          institution: "State University",
          degree: "B.Sc. Computer Science",
          startDate: "2015-09",
          endDate: "2019-06",
        },
      ],
      skills: [{ name: "TypeScript" }, { name: "PostgreSQL" }],
    };

    const result = resumeContentSchema.parse(payload);

    expect(result.summary).toBe(payload.summary);
    expect(result.experience[0]).toMatchObject({
      company: "Acme Corp",
      role: "Senior Engineer",
      location: "",
      current: false,
      highlights: payload.experience[0]!.highlights,
    });
    expect(typeof result.experience[0]!.id).toBe("string");
    expect(result.experience[0]!.id.length).toBeGreaterThan(0);
    expect(result.education[0]).toMatchObject({
      institution: "State University",
      degree: "B.Sc. Computer Science",
      fieldOfStudy: "",
      description: "",
    });
    expect(result.skills.map((s) => s.name)).toEqual(["TypeScript", "PostgreSQL"]);
  });

  it("assigns a distinct id to each entry missing one", () => {
    const result = resumeContentSchema.parse({
      experience: [
        { company: "A", role: "Eng", startDate: "2020" },
        { company: "B", role: "Eng", startDate: "2021" },
      ],
    });

    const [first, second] = result.experience;
    expect(first!.id).not.toBe(second!.id);
  });

  it("preserves an explicitly provided id", () => {
    const result = resumeContentSchema.parse({
      skills: [{ id: "fixed-id", name: "Go" }],
    });

    expect(result.skills[0]!.id).toBe("fixed-id");
  });

  it.each([
    ["missing company", { role: "Eng", startDate: "2020" }],
    ["missing role", { company: "Acme", startDate: "2020" }],
    ["missing startDate", { company: "Acme", role: "Eng" }],
    ["empty company", { company: "", role: "Eng", startDate: "2020" }],
  ])("rejects an experience entry with %s", (_label, entry) => {
    const result = resumeContentSchema.safeParse({ experience: [entry] });
    expect(result.success).toBe(false);
  });

  it("drops blank highlight lines instead of rejecting the entry", () => {
    const result = resumeContentSchema.safeParse({
      experience: [
        {
          company: "Acme",
          role: "Eng",
          startDate: "2020",
          highlights: ["Led the migration", "", "   ", "Cut latency"],
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.experience[0]!.highlights).toEqual([
      "Led the migration",
      "Cut latency",
    ]);
  });

  it("rejects an education entry missing required fields", () => {
    const result = resumeContentSchema.safeParse({
      education: [{ degree: "B.Sc." }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a skill entry with an empty name", () => {
    const result = resumeContentSchema.safeParse({
      skills: [{ name: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a summary exceeding the max length", () => {
    const result = resumeContentSchema.safeParse({
      summary: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload with the wrong top-level shape", () => {
    const result = resumeContentSchema.safeParse({ experience: "not-an-array" });
    expect(result.success).toBe(false);
  });
});
