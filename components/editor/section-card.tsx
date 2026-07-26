"use client";

import { Collapse } from "antd";
import { useEffect, useRef } from "react";

import { slugify } from "@/lib/slugify";

import styles from "./section-card.module.css";
import { useSectionNav } from "./section-nav";

export function SectionCard({
  id,
  title,
  meta,
  extra,
  children,
  defaultOpen = true,
}: {
  id?: string;
  title: string;
  meta?: string;
  // Rendered on the right of the header row (same line as the title), e.g. an
  // action button. Interactive content should stopPropagation so a click
  // doesn't also toggle the collapse.
  extra?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const nav = useSectionNav();
  // Anchor for the jump-to-section nav; derived from the title unless an
  // explicit id is given.
  const anchorId = id ?? slugify(title);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = anchorRef.current;
    if (!nav || !el) return;
    nav.register(anchorId, title, el);
    return () => nav.unregister(anchorId);
  }, [nav, anchorId, title]);

  // When inside a SectionNavProvider the open state is controlled (so the nav
  // can expand a section on jump and drive expand/collapse-all); otherwise the
  // card manages itself as before.
  const controlled = nav != null;
  const openProps = controlled
    ? {
        activeKey: nav!.isOpen(anchorId) ? ["1"] : [],
        onChange: () => nav!.setOpen(anchorId, !nav!.isOpen(anchorId)),
      }
    : { defaultActiveKey: defaultOpen ? ["1"] : [] };

  return (
    <div id={anchorId} ref={anchorRef} className={styles.anchor}>
      <Collapse
        ghost
        className={styles.card}
        {...openProps}
        items={[
          {
            key: "1",
            label: (
              <div className={styles.header}>
                <span className={`font-display ${styles.title}`}>{title}</span>
                {meta ? <span className={`font-mono ${styles.meta}`}>{meta}</span> : null}
              </div>
            ),
            extra,
            children,
          },
        ]}
      />
    </div>
  );
}
