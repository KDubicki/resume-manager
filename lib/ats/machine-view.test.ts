import { describe, expect, it } from "vitest";

import { buildMachineView, isSectionHeading } from "./machine-view";

describe("isSectionHeading", () => {
  it("recognises template headings in any case, with a trailing colon", () => {
    expect(isSectionHeading("EXPERIENCE")).toBe(true);
    expect(isSectionHeading("About Me")).toBe(true);
    expect(isSectionHeading("CERTIFICATIONS & COURSES")).toBe(true);
    expect(isSectionHeading("Skills:")).toBe(true);
  });

  it("recognises common ATS synonyms", () => {
    expect(isSectionHeading("Work Experience")).toBe(true);
    expect(isSectionHeading("PROFILE")).toBe(true);
  });

  it("rejects letter-spaced headings and ordinary lines", () => {
    // What letterSpacing used to produce — a parser can't match it.
    expect(isSectionHeading("E D U C AT I O N")).toBe(false);
    expect(isSectionHeading("Skills in Python and Go")).toBe(false);
  });
});

describe("buildMachineView", () => {
  const view = buildMachineView([
    ["Jane Doe", "  SUMMARY ", "Built   things.", ""],
    ["EXPERIENCE", "Acme · 2020 – Present"],
  ]);

  it("numbers lines continuously across pages and drops blank ones", () => {
    expect(view.lines.map((line) => [line.number, line.page, line.text])).toEqual([
      [1, 1, "Jane Doe"],
      [2, 1, "SUMMARY"],
      [3, 1, "Built things."],
      [4, 2, "EXPERIENCE"],
      [5, 2, "Acme · 2020 – Present"],
    ]);
  });

  it("counts pages, words and recognised sections", () => {
    expect(view.pages).toBe(2);
    expect(view.words).toBe(11);
    expect(view.sections).toEqual(["SUMMARY", "EXPERIENCE"]);
  });
});
