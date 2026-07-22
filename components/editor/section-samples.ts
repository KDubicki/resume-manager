import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  SkillGroup,
} from "@/lib/schemas/resume";

// Realistic starter content for the "Add sample" empty states (UX-5). Kept in
// one place so the examples read as a coherent, well-written resume — the point
// is to show a new user what a strong entry looks like, not just fill fields.
// Fresh ids each call so repeated inserts never collide.

export function sampleExperience(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    company: "Acme Corp",
    role: "Senior Software Engineer",
    location: "Remote",
    startDate: "2021-03",
    endDate: "",
    current: true,
    highlights: [
      "Led the migration from a monolith to services, cutting p95 latency by 40%",
      "Mentored four engineers and introduced a review rubric adopted across the org",
    ],
  };
}

export function sampleEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: "State University",
    degree: "B.S. Computer Science",
    fieldOfStudy: "Computer Science",
    startDate: "2015-09",
    endDate: "2019-06",
    current: false,
    description: "Graduated with honors; coursework focused on distributed systems.",
  };
}

export function sampleProject(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "Open-source CLI toolkit",
    description: "A cross-platform CLI for scaffolding TypeScript services.",
    highlights: [
      "Grew to 2k GitHub stars and 30+ contributors",
      "Automated the release pipeline with semantic versioning",
    ],
  };
}

export function sampleSkillGroup(): SkillGroup {
  return {
    id: crypto.randomUUID(),
    category: "Languages",
    skills: ["TypeScript", "Python", "Go"],
  };
}

export function sampleLanguage(): LanguageEntry {
  return {
    id: crypto.randomUUID(),
    name: "English",
    proficiency: "Native",
  };
}

export function sampleCertifications(): CertificationEntry[] {
  return [
    { id: crypto.randomUUID(), name: "AWS Certified Solutions Architect – Associate" },
    { id: crypto.randomUUID(), name: "Certified Kubernetes Administrator (CKA)" },
  ];
}
