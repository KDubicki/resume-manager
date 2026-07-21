import { describe, expect, it } from "vitest";

import { resumeContentSchema, type ResumeContent } from "../schemas/resume";

import { extractKeywords, matchKeywords, resumeToText, tokenize } from "./keywords";

function content(overrides: Partial<ResumeContent> = {}): ResumeContent {
  return { ...resumeContentSchema.parse({}), ...overrides };
}

describe("tokenize", () => {
  it("lowercases and splits on punctuation and whitespace", () => {
    expect(tokenize("React, TypeScript; and GraphQL.")).toEqual([
      "react",
      "typescript",
      "and",
      "graphql",
    ]);
  });

  it("preserves symbols that are load-bearing in tech terms", () => {
    expect(tokenize("C++ C# .NET node.js CI/CD")).toEqual(["c++", "c#", "net", "node.js", "ci/cd"]);
  });

  it("does not fuse a trailing sentence period onto a word", () => {
    expect(tokenize("We use Kubernetes.")).toEqual(["we", "use", "kubernetes"]);
  });
});

describe("extractKeywords", () => {
  it("drops stopwords, short tokens, and bare numbers", () => {
    const result = extractKeywords("We have 5 years of experience with the React framework");
    const terms = result.map((k) => k.term);

    expect(terms).toContain("react");
    expect(terms).toContain("framework");
    // stopwords / boilerplate / numbers / single chars are removed
    expect(terms).not.toContain("we");
    expect(terms).not.toContain("years");
    expect(terms).not.toContain("experience");
    expect(terms).not.toContain("5");
  });

  it("ranks by frequency, then alphabetically", () => {
    const result = extractKeywords("kubernetes kubernetes docker docker docker ansible");

    expect(result).toEqual([
      { term: "docker", count: 3 },
      { term: "kubernetes", count: 2 },
      { term: "ansible", count: 1 },
    ]);
  });
});

describe("resumeToText", () => {
  it("gathers text from every user-authored section", () => {
    const text = resumeToText(
      content({
        summary: "Backend engineer",
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
        skillGroups: [{ id: "2", category: "Backend", skills: ["PostgreSQL", "Redis"] }],
      }),
    ).toLowerCase();

    expect(text).toContain("backend engineer");
    expect(text).toContain("kafka");
    expect(text).toContain("postgresql");
    expect(text).toContain("redis");
  });
});

describe("matchKeywords", () => {
  it("splits JD keywords into matched and missing against the resume", () => {
    const resume = content({
      summary: "Senior engineer working with React and PostgreSQL",
    });

    const result = matchKeywords(
      "Looking for a React engineer with Kubernetes and PostgreSQL",
      resume,
    );

    expect(result.matched).toContain("react");
    expect(result.matched).toContain("postgresql");
    expect(result.missing).toContain("kubernetes");
    expect(result.total).toBe(result.matched.length + result.missing.length);
  });

  it("returns empty results for a blank job description", () => {
    const result = matchKeywords("", content({ summary: "React developer" }));

    expect(result).toEqual({ matched: [], missing: [], total: 0 });
  });

  it("honors the keyword limit (most frequent first)", () => {
    const jd = "alpha alpha beta gamma delta epsilon";
    const result = matchKeywords(jd, content(), 2);

    // Only the two most frequent JD keywords are considered.
    expect(result.total).toBe(2);
    expect(result.missing).toEqual(["alpha", "beta"]);
  });
});
