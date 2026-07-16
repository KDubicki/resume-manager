import { describe, expect, it } from "vitest";

import {
  defaultResumeContent,
  normalizeSidebarColumns,
  resumeContentSchema,
} from "./resume";

describe("resumeContentSchema", () => {
  it("fills in defaults for an empty payload", () => {
    const result = resumeContentSchema.parse({});

    expect(result).toEqual({
      template: "classic",
      theme: {
        accent: "#2a6cf0",
      },
      sidebarColumns: {
        left: ["contact", "education", "interests", "certifications"],
        right: ["summary", "experience", "skills", "projects", "languages"],
      },
      contact: {
        fullName: "",
        headline: "",
        phone: "",
        email: "",
        linkedin: "",
        location: "",
      },
      summary: "",
      experience: [],
      education: [],
      projects: [],
      skillGroups: [],
      languages: [],
      certifications: [],
      interests: "",
    });
    expect(defaultResumeContent).toEqual(result);
  });

  it("defaults the template to classic and accepts sidebar", () => {
    expect(resumeContentSchema.parse({}).template).toBe("classic");
    expect(resumeContentSchema.parse({ template: "sidebar" }).template).toBe("sidebar");
    expect(resumeContentSchema.safeParse({ template: "fancy" }).success).toBe(false);
  });

  it("defaults the accent, accepts a valid hex, and falls back on a bad one", () => {
    // Missing theme → default accent (a legacy blob has no theme key).
    expect(resumeContentSchema.parse({}).theme.accent).toBe("#2a6cf0");
    // A valid 6-digit hex is kept.
    expect(resumeContentSchema.parse({ theme: { accent: "#0f766e" } }).theme.accent).toBe("#0f766e");
    // A malformed value must not fail the whole parse (autosave would break);
    // `.catch` falls back to the default instead.
    expect(resumeContentSchema.parse({ theme: { accent: "not-a-color" } }).theme.accent).toBe(
      "#2a6cf0",
    );
  });

  it("parses a legacy blob that predates the new keys", () => {
    // A row written before contact/projects/skillGroups existed must still
    // load — every new key has a default, so tolerant parsing backfills them.
    const legacy = {
      summary: "Older draft.",
      experience: [{ company: "Acme", role: "Eng", startDate: "2020" }],
    };

    const result = resumeContentSchema.safeParse(legacy);

    expect(result.success).toBe(true);
    expect(result.success && result.data.template).toBe("classic");
    expect(result.success && result.data.contact.fullName).toBe("");
    expect(result.success && result.data.skillGroups).toEqual([]);
    expect(result.success && result.data.projects).toEqual([]);
  });

  it("accepts a fully populated, valid payload", () => {
    const payload = {
      template: "sidebar" as const,
      contact: {
        fullName: "Ada Lovelace",
        headline: "Systems Engineer",
        email: "ada@example.com",
      },
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
      projects: [
        { name: "Pipeline", description: "Data pipeline", highlights: ["Automated ingest"] },
      ],
      skillGroups: [{ category: "Programming", skills: ["TypeScript", "Go"] }],
      languages: [{ name: "English", proficiency: "Native" }],
      certifications: [{ name: "CCNA" }],
      interests: "Powerlifting and hiking.",
    };

    const result = resumeContentSchema.parse(payload);

    expect(result.template).toBe("sidebar");
    expect(result.contact.fullName).toBe("Ada Lovelace");
    expect(result.contact.phone).toBe("");
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
    expect(result.projects[0]).toMatchObject({ name: "Pipeline", description: "Data pipeline" });
    expect(result.skillGroups[0]!.skills).toEqual(["TypeScript", "Go"]);
    expect(result.languages[0]).toMatchObject({ name: "English", proficiency: "Native" });
    expect(result.certifications.map((c) => c.name)).toEqual(["CCNA"]);
    expect(result.interests).toBe("Powerlifting and hiking.");
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
      skillGroups: [{ id: "fixed-id", category: "Languages", skills: ["Go"] }],
    });

    expect(result.skillGroups[0]!.id).toBe("fixed-id");
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

  it("drops blank skills within a group instead of rejecting it", () => {
    const result = resumeContentSchema.safeParse({
      skillGroups: [{ category: "Tools", skills: ["Docker", "", "  ", "Ansible"] }],
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.skillGroups[0]!.skills).toEqual(["Docker", "Ansible"]);
  });

  it("rejects an education entry missing required fields", () => {
    const result = resumeContentSchema.safeParse({
      education: [{ degree: "B.Sc." }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a project entry with an empty name", () => {
    const result = resumeContentSchema.safeParse({
      projects: [{ name: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a summary exceeding the max length", () => {
    const result = resumeContentSchema.safeParse({
      summary: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("appends unplaced sidebar sections to the right column", () => {
    // A layout saved before `languages`/`projects` existed must not silently
    // drop them — they get appended so they still render and stay editable.
    const normalized = normalizeSidebarColumns({
      left: ["contact", "education"],
      right: ["summary", "experience"],
    });

    expect(normalized.left).toEqual(["contact", "education"]);
    expect(normalized.right).toEqual([
      "summary",
      "experience",
      "skills",
      "projects",
      "languages",
      "certifications",
      "interests",
    ]);
  });

  it("rejects a payload with the wrong top-level shape", () => {
    const result = resumeContentSchema.safeParse({ experience: "not-an-array" });
    expect(result.success).toBe(false);
  });
});
