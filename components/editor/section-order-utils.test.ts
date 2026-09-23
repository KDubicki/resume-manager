import { describe, expect, it } from "vitest";

import type { SidebarColumns } from "@/lib/schemas/resume";

import { columnOf, moveSection, reorderVisible } from "./section-order-utils";

describe("reorderVisible", () => {
  const order = ["summary", "experience", "education", "projects", "skills"];

  it("reorders like a plain list when nothing is hidden", () => {
    expect(reorderVisible(order, new Set(), 0, 2)).toEqual([
      "experience",
      "education",
      "summary",
      "projects",
      "skills",
    ]);
  });

  it("keeps hidden sections in their exact slot", () => {
    // Visible: summary, education, skills — move skills to the top.
    const hidden = new Set(["experience", "projects"]);
    expect(reorderVisible(order, hidden, 2, 0)).toEqual([
      "skills",
      "experience",
      "summary",
      "projects",
      "education",
    ]);
  });

  it("returns an unchanged copy for a no-op or out-of-range move", () => {
    expect(reorderVisible(order, new Set(), 1, 1)).toEqual(order);
    expect(reorderVisible(order, new Set(), 0, 9)).toEqual(order);
  });
});

describe("moveSection", () => {
  const columns: SidebarColumns = {
    left: ["contact", "education"],
    right: ["summary", "experience", "skills"],
  };

  it("reorders within a column", () => {
    expect(moveSection(columns, "skills", "right", 0)).toEqual({
      left: ["contact", "education"],
      right: ["skills", "summary", "experience"],
    });
  });

  it("moves across columns at the given index", () => {
    expect(moveSection(columns, "experience", "left", 1)).toEqual({
      left: ["contact", "experience", "education"],
      right: ["summary", "skills"],
    });
  });

  it("can fill an empty column and clamps the index", () => {
    const next = moveSection({ left: [], right: ["summary"] }, "summary", "left", 5);
    expect(next).toEqual({ left: ["summary"], right: [] });
  });

  it("finds a section's column", () => {
    expect(columnOf(columns, "education")).toBe("left");
    expect(columnOf(columns, "languages")).toBeNull();
  });
});
