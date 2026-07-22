import { describe, expect, it } from "vitest";
import type { FieldErrors } from "react-hook-form";

import { anchorFor, flattenErrors, locate } from "./error-summary-utils";

describe("flattenErrors", () => {
  it("returns nothing for an empty error tree", () => {
    expect(flattenErrors({})).toEqual([]);
  });

  it("flattens a top-level field error", () => {
    const errors = {
      summary: { type: "too_big", message: "Too long", ref: {} },
    } as unknown as FieldErrors;
    expect(flattenErrors(errors)).toEqual([{ name: "summary", message: "Too long" }]);
  });

  it("flattens array-of-entry errors into dotted, indexed names", () => {
    const errors = {
      experience: [
        { company: { type: "too_small", message: "Company is required", ref: {} } },
        undefined,
        { role: { type: "too_small", message: "Role is required", ref: {} } },
      ],
    } as unknown as FieldErrors;

    expect(flattenErrors(errors)).toEqual([
      { name: "experience.0.company", message: "Company is required" },
      { name: "experience.2.role", message: "Role is required" },
    ]);
  });

  it("collects multiple leaves under one entry", () => {
    const errors = {
      education: [
        {
          institution: { message: "Institution is required" },
          degree: { message: "Degree is required" },
        },
      ],
    } as unknown as FieldErrors;

    expect(flattenErrors(errors).map((e) => e.name)).toEqual([
      "education.0.institution",
      "education.0.degree",
    ]);
  });
});

describe("anchorFor", () => {
  it("maps a field prefix to its section anchor slug", () => {
    expect(anchorFor("experience.0.company")).toBe("experience");
    // "Certifications & Courses" title slugifies with the ampersand dropped.
    expect(anchorFor("certifications.1.name")).toBe("certifications-courses");
  });

  it("returns null for a prefix without a known section", () => {
    expect(anchorFor("mystery.0.x")).toBeNull();
  });
});

describe("locate", () => {
  it("labels an indexed field with a 1-based position", () => {
    expect(locate("experience.2.company")).toBe("Experience 3");
    expect(locate("languages.0.name")).toBe("Language 1");
  });

  it("labels a non-indexed field with the section alone", () => {
    expect(locate("summary")).toBe("Summary");
  });
});
