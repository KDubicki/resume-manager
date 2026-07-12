"use client";

import { Collapse } from "antd";

import styles from "./section-card.module.css";

export function SectionCard({
  title,
  meta,
  children,
  defaultOpen = true,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapse
      ghost
      className={styles.card}
      defaultActiveKey={defaultOpen ? ["1"] : []}
      items={[
        {
          key: "1",
          label: (
            <div className={styles.header}>
              <span className={`font-display ${styles.title}`}>{title}</span>
              {meta ? <span className={`font-mono ${styles.meta}`}>{meta}</span> : null}
            </div>
          ),
          children,
        },
      ]}
    />
  );
}
