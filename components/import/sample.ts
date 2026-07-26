// A minimal, valid JSON Resume (https://jsonresume.org) document offered as a
// download in the import UI so users can see the exact shape the importer
// expects and fill it in.
export const SAMPLE_JSON_RESUME = {
  basics: {
    name: "Jane Doe",
    label: "Software Engineer",
    email: "jane@example.com",
    phone: "+1 555 010 1234",
    summary: "Engineer focused on backend systems and developer tooling.",
    location: { city: "Warsaw", region: "Mazowieckie", countryCode: "PL" },
    profiles: [{ network: "LinkedIn", url: "https://www.linkedin.com/in/jane-doe" }],
  },
  work: [
    {
      name: "Acme Corp",
      position: "Senior Software Engineer",
      startDate: "2022-03",
      summary: "Led the payments platform team.",
      highlights: ["Cut checkout latency by 40%", "Mentored 3 engineers"],
    },
  ],
  education: [
    {
      institution: "University of Warsaw",
      studyType: "B.Sc.",
      area: "Computer Science",
      startDate: "2016",
      endDate: "2020",
    },
  ],
  skills: [
    { name: "Languages", keywords: ["TypeScript", "Go", "Python"] },
    { name: "Infrastructure", keywords: ["Docker", "Kubernetes", "PostgreSQL"] },
  ],
  languages: [
    { language: "English", fluency: "Native" },
    { language: "Polish", fluency: "Professional" },
  ],
  projects: [
    { name: "OpenLog", description: "A structured logging library.", highlights: ["1k+ GitHub stars"] },
  ],
};

// Triggers a client-side download of the sample as `sample-resume.json`.
export function downloadSampleJsonResume() {
  const blob = new Blob([JSON.stringify(SAMPLE_JSON_RESUME, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sample-resume.json";
  link.click();
  URL.revokeObjectURL(url);
}
