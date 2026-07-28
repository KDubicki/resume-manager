import { describe, expect, it } from "vitest";

import type { ApplicationStatus } from "@/lib/schemas/application";

import {
  countByStatus,
  filterAndSortApplications,
  type ApplicationItem,
} from "./application-filters";

function item(overrides: Partial<ApplicationItem> & { id: string }): ApplicationItem {
  return {
    company: "Acme",
    role: "Engineer",
    jobUrl: "",
    jobDescription: "",
    notes: "",
    status: "SAVED" as ApplicationStatus,
    resumeId: null,
    resumeTitle: null,
    updatedAt: 0,
    appliedAt: null,
    updatedLabel: "Jan 1, 2026",
    appliedLabel: null,
    ...overrides,
  };
}

const applications = [
  item({ id: "a", company: "Zeta", status: "APPLIED", updatedAt: 30, appliedAt: 10 }),
  item({ id: "b", company: "Acme", status: "SAVED", updatedAt: 20 }),
  item({ id: "c", company: "Mono", status: "INTERVIEW", updatedAt: 10, appliedAt: 50 }),
];

const base = { query: "", status: "ALL" as const, sort: "updated-desc" as const };

describe("filterAndSortApplications", () => {
  it("sorts by last update by default", () => {
    expect(filterAndSortApplications(applications, base).map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts never-sent applications to the bottom when sorting by applied date", () => {
    const sorted = filterAndSortApplications(applications, { ...base, sort: "applied-desc" });
    expect(sorted.map((a) => a.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by pipeline stage, not alphabetically", () => {
    const sorted = filterAndSortApplications(applications, { ...base, sort: "status" });
    expect(sorted.map((a) => a.status)).toEqual(["SAVED", "APPLIED", "INTERVIEW"]);
  });

  it("sorts by company name", () => {
    const sorted = filterAndSortApplications(applications, { ...base, sort: "company-asc" });
    expect(sorted.map((a) => a.company)).toEqual(["Acme", "Mono", "Zeta"]);
  });

  it("filters by stage", () => {
    const filtered = filterAndSortApplications(applications, { ...base, status: "APPLIED" });
    expect(filtered.map((a) => a.id)).toEqual(["a"]);
  });

  it("searches company, role, linked resume title and notes, case-insensitively", () => {
    const pool = [
      item({ id: "a", company: "Zeta" }),
      item({ id: "b", role: "Security Analyst" }),
      item({ id: "c", resumeTitle: "Infra resume" }),
      item({ id: "d", notes: "Referred by Ada" }),
    ];
    const ids = (query: string) =>
      filterAndSortApplications(pool, { ...base, query }).map((a) => a.id);

    expect(ids("zet")).toEqual(["a"]);
    expect(ids("ANALYST")).toEqual(["b"]);
    expect(ids("infra")).toEqual(["c"]);
    expect(ids("ada")).toEqual(["d"]);
    expect(ids("  ")).toHaveLength(4);
  });

  it("applies the stage filter and the query together", () => {
    const filtered = filterAndSortApplications(applications, {
      ...base,
      status: "APPLIED",
      query: "acme",
    });
    expect(filtered).toHaveLength(0);
  });

  it("doesn't mutate the input array", () => {
    const original = [...applications];
    filterAndSortApplications(applications, { ...base, sort: "company-asc" });
    expect(applications).toEqual(original);
  });
});

describe("countByStatus", () => {
  it("counts every stage plus the total, including empty stages", () => {
    expect(countByStatus(applications)).toEqual({
      ALL: 3,
      SAVED: 1,
      APPLIED: 1,
      INTERVIEW: 1,
      OFFER: 0,
      REJECTED: 0,
    });
  });
});
