"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import styles from "./section-nav.module.css";

interface SectionNavContextValue {
  register: (id: string, title: string, el: HTMLElement) => void;
  unregister: (id: string) => void;
  isOpen: (id: string) => boolean;
  setOpen: (id: string, open: boolean) => void;
}

const SectionNavContext = createContext<SectionNavContextValue | null>(null);

// SectionCard reads this to register itself and drive its own collapse state.
// Null when a card is rendered outside a provider, in which case the card falls
// back to its own uncontrolled behavior.
export function useSectionNav() {
  return useContext(SectionNavContext);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Wraps the editor sections: tracks each SectionCard's open state and DOM node,
// and renders a sticky "jump to section" bar above them (UX-2). Cards register
// their real anchor element, so the nav order always matches what's on screen —
// including the template-specific sections — with no hardcoded list to drift.
export function SectionNavProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, { title: string; el: HTMLElement }>>({});
  const [open, setOpenState] = useState<Record<string, boolean>>({});

  const register = useCallback((id: string, title: string, el: HTMLElement) => {
    setEntries((prev) => {
      const existing = prev[id];
      if (existing && existing.title === title && existing.el === el) return prev;
      return { ...prev, [id]: { title, el } };
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setEntries((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Sections default to open; a card is closed only once explicitly collapsed.
  const isOpen = useCallback((id: string) => open[id] ?? true, [open]);
  const setOpen = useCallback((id: string, value: boolean) => {
    setOpenState((prev) => ({ ...prev, [id]: value }));
  }, []);

  const context = useMemo<SectionNavContextValue>(
    () => ({ register, unregister, isOpen, setOpen }),
    [register, unregister, isOpen, setOpen],
  );

  // Ordered by actual document position so the nav mirrors the on-screen order
  // regardless of the order cards happened to register in.
  const sections = useMemo(
    () =>
      Object.entries(entries)
        .map(([id, { title, el }]) => ({ id, title, el }))
        .sort((a, b) =>
          a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
        ),
    [entries],
  );

  const jumpTo = (id: string) => {
    setOpen(id, true);
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const setAll = (value: boolean) => {
    setOpenState((prev) => {
      const next = { ...prev };
      for (const { id } of sections) next[id] = value;
      return next;
    });
  };

  return (
    <SectionNavContext.Provider value={context}>
      {sections.length > 0 && (
        <nav className={styles.nav} aria-label="Jump to section">
          <div className={styles.list}>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`font-mono ${styles.chip}`}
                onClick={() => jumpTo(section.id)}
              >
                {section.title}
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={() => setAll(true)}>
              Expand all
            </button>
            <button type="button" className={styles.action} onClick={() => setAll(false)}>
              Collapse all
            </button>
          </div>
        </nav>
      )}
      {children}
    </SectionNavContext.Provider>
  );
}
