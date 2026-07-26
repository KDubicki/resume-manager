import { describe, expect, it } from "vitest";

import { resumeContentSchema } from "@/lib/schemas/resume";

import { isLikelyJsonResume, mapJsonResume } from "./json-resume";

// A representative JSON Resume document exercising every mapped section.
const sample = {
  basics: {
    name: "Maurycy Kowalski",
    label: "Security Engineer",
    email: "maurycy@example.com",
    phone: "+48 123 456 789",
    url: "https://maurycy.dev",
    summary: "IT specialist with network security experience.",
    location: { city: "Poznań", region: "Wielkopolskie", countryCode: "PL" },
    profiles: [{ network: "LinkedIn", url: "https://www.linkedin.com/in/maurycy-1111111/" }],
  },
  work: [
    {
      name: "Stadler",
      position: "Security and Network Engineer",
      startDate: "2025-05",
      summary: "Owned OT network security.",
      highlights: ["Designed OT network from scratch", "Selected routers and firewalls"],
    },
    {
      company: "Allegro",
      position: "DevOps Engineer",
      startDate: "2022-01",
      endDate: "2024-12",
      highlights: ["Built CI/CD"],
    },
  ],
  education: [
    {
      institution: "Poznań University of Technology",
      studyType: "Master's degree",
      area: "ICT",
      startDate: "2024",
      endDate: "2025-09",
      score: "4.8",
      courses: ["Cryptography", "Networks"],
    },
  ],
  skills: [
    { name: "Networking", keywords: ["TCP/IP", "Subnetting"] },
    { name: "Docker" },
    { name: "Ansible" },
  ],
  languages: [{ language: "Polish", fluency: "Native" }, { language: "English", fluency: "C1" }],
  certificates: [{ name: "Huawei HCIA", issuer: "Huawei", date: "2023-06" }],
  projects: [{ name: "Homelab", description: "Self-hosted infra", highlights: ["k8s", "GitOps"] }],
  interests: [{ name: "CTF", keywords: ["web", "crypto"] }],
};

describe("mapJsonResume", () => {
  it("maps every section into a schema-valid resume", () => {
    const parsed = resumeContentSchema.safeParse(mapJsonResume(sample));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const c = parsed.data;

    expect(c.contact).toMatchObject({
      fullName: "Maurycy Kowalski",
      headline: "Security Engineer",
      email: "maurycy@example.com",
      phone: "+48 123 456 789",
      linkedin: "https://www.linkedin.com/in/maurycy-1111111/",
      location: "Poznań, Wielkopolskie",
    });
    expect(c.summary).toContain("IT specialist");

    // Work → experience: dates formatted, ongoing role flagged current, work
    // summary folded in as the first highlight.
    expect(c.experience).toHaveLength(2);
    expect(c.experience[0]).toMatchObject({
      company: "Stadler",
      role: "Security and Network Engineer",
      startDate: "May 2025",
      current: true,
    });
    expect(c.experience[0]!.highlights[0]).toBe("Owned OT network security.");
    expect(c.experience[1]).toMatchObject({ startDate: "Jan 2022", endDate: "Dec 2024", current: false });

    // Education
    expect(c.education[0]).toMatchObject({
      institution: "Poznań University of Technology",
      degree: "Master's degree",
      fieldOfStudy: "ICT",
      startDate: "2024",
      endDate: "Sep 2025",
    });
    expect(c.education[0]!.description).toContain("Score: 4.8");
    expect(c.education[0]!.description).toContain("Cryptography");

    // Skills: a keyworded group plus a fallback group for bare skill names.
    expect(c.skillGroups[0]).toMatchObject({ category: "Networking", skills: ["TCP/IP", "Subnetting"] });
    expect(c.skillGroups[1]).toMatchObject({ category: "Skills", skills: ["Docker", "Ansible"] });

    expect(c.languages).toEqual([
      expect.objectContaining({ name: "Polish", proficiency: "Native" }),
      expect.objectContaining({ name: "English", proficiency: "C1" }),
    ]);
    expect(c.certifications[0]!.name).toBe("Huawei HCIA — Huawei (Jun 2023)");
    expect(c.projects[0]).toMatchObject({ name: "Homelab", description: "Self-hosted infra" });
    expect(c.interests).toBe("CTF: web, crypto");

    // Every entry gets a generated id from the schema.
    expect(c.experience.every((e) => e.id.length > 0)).toBe(true);
  });

  it("produces a valid (empty) resume from junk and drops unmapped sections", () => {
    const parsed = resumeContentSchema.safeParse(mapJsonResume({ nonsense: true, volunteer: [{}] }));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.experience).toEqual([]);
    expect(parsed.data.contact.fullName).toBe("");
  });

  it("fills placeholders for a partial work entry instead of failing the whole import", () => {
    const parsed = resumeContentSchema.safeParse(
      mapJsonResume({ work: [{ highlights: ["Did things"] }] }),
    );
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.experience[0]).toMatchObject({
      company: "Unspecified",
      role: "Unspecified",
      startDate: "Unspecified",
    });
  });

  it("does not crash on non-object input", () => {
    expect(() => mapJsonResume(null)).not.toThrow();
    expect(() => mapJsonResume("nope")).not.toThrow();
    expect(resumeContentSchema.safeParse(mapJsonResume(null)).success).toBe(true);
  });

  it("detects whether a payload looks like JSON Resume", () => {
    expect(isLikelyJsonResume(sample)).toBe(true);
    expect(isLikelyJsonResume({ work: [] })).toBe(true);
    expect(isLikelyJsonResume({ foo: 1 })).toBe(false);
    expect(isLikelyJsonResume(null)).toBe(false);
  });
});
