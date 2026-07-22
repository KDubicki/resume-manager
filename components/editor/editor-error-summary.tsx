"use client";

import { useFormContext, useFormState, type FieldPath } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

import { anchorFor, flattenErrors, locate } from "./error-summary-utils";
import styles from "./editor-error-summary.module.css";
import { useSectionNav } from "./section-nav";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Inline validation summary (UX-4): a running count of fields needing attention,
// each a button that expands its section and focuses the field.
export function EditorErrorSummary() {
  const { control, setFocus } = useFormContext<ResumeContent>();
  const { errors } = useFormState({ control });
  const nav = useSectionNav();

  const flat = flattenErrors(errors);
  if (flat.length === 0) return null;

  const jump = (name: string) => {
    const anchor = anchorFor(name);
    if (anchor) nav?.setOpen(anchor, true);
    // Wait a frame so a just-expanded section is in the DOM before focusing.
    requestAnimationFrame(() => {
      setFocus(name as FieldPath<ResumeContent>, { shouldSelect: true });
      document.getElementsByName(name)[0]?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center",
      });
    });
  };

  return (
    <div className={styles.summary} role="alert">
      <div className={styles.head}>
        {flat.length} {flat.length === 1 ? "field needs" : "fields need"} attention
      </div>
      <ul className={styles.list}>
        {flat.map((error) => (
          <li key={error.name}>
            <button type="button" className={styles.item} onClick={() => jump(error.name)}>
              <span className={styles.locator}>{locate(error.name)}</span>
              <span className={styles.message}>{error.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
