import { describe, expect, it } from "vitest";

import { applicationInputSchema, isSentStatus } from "./application";

const valid = { company: "Acme Corp", role: "Security Engineer" };

describe("applicationInputSchema", () => {
  it("fills in every optional field so the DB row is never partial", () => {
    const parsed = applicationInputSchema.parse(valid);
    expect(parsed).toEqual({
      company: "Acme Corp",
      role: "Security Engineer",
      jobUrl: "",
      jobDescription: "",
      notes: "",
      status: "SAVED",
      resumeId: null,
    });
  });

  it("trims company and role, and rejects blank ones", () => {
    expect(applicationInputSchema.parse({ ...valid, company: "  Acme Corp  " }).company).toBe(
      "Acme Corp",
    );

    const result = applicationInputSchema.safeParse({ ...valid, company: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Company is required");
  });

  it("accepts a blank posting link but not a malformed one", () => {
    expect(applicationInputSchema.safeParse({ ...valid, jobUrl: "" }).success).toBe(true);
    expect(
      applicationInputSchema.safeParse({ ...valid, jobUrl: "https://jobs.acme.test/1" }).success,
    ).toBe(true);
    expect(applicationInputSchema.safeParse({ ...valid, jobUrl: "acme.test/jobs" }).success).toBe(
      false,
    );
  });

  it("normalizes a cleared resume select to null", () => {
    expect(applicationInputSchema.parse({ ...valid, resumeId: "" }).resumeId).toBeNull();
    expect(applicationInputSchema.parse({ ...valid, resumeId: "   " }).resumeId).toBeNull();
    expect(applicationInputSchema.parse({ ...valid, resumeId: null }).resumeId).toBeNull();
    expect(applicationInputSchema.parse({ ...valid, resumeId: "abc123" }).resumeId).toBe("abc123");
  });

  it("rejects an unknown stage", () => {
    expect(applicationInputSchema.safeParse({ ...valid, status: "GHOSTED" }).success).toBe(false);
  });

  it("rejects a job description past the storage ceiling", () => {
    const tooLong = "a".repeat(20001);
    expect(applicationInputSchema.safeParse({ ...valid, jobDescription: tooLong }).success).toBe(
      false,
    );
  });
});

describe("isSentStatus", () => {
  it("treats everything from APPLIED through OFFER as sent", () => {
    expect(isSentStatus("SAVED")).toBe(false);
    expect(isSentStatus("APPLIED")).toBe(true);
    expect(isSentStatus("INTERVIEW")).toBe(true);
    expect(isSentStatus("OFFER")).toBe(true);
    // A rejection was sent too, but it never *starts* the clock — the stamp is
    // already there by the time an application can be rejected.
    expect(isSentStatus("REJECTED")).toBe(false);
  });
});
