"use client";

import { Button, Space, Typography } from "antd";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import { SaveIndicator } from "./save-indicator";
import styles from "./top-bar.module.css";

export function TopBar({
  title,
  onTitleChange,
  lastSavedAt,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  lastSavedAt: Date | null;
}) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand} aria-hidden="true">
        ◱
      </div>
      <Typography.Title
        level={4}
        className={`font-display ${styles.title}`}
        editable={{ onChange: onTitleChange }}
        style={{ margin: 0 }}
      >
        {title}
      </Typography.Title>
      <Space size="middle" className={styles.controls}>
        <SaveIndicator lastSavedAt={lastSavedAt} />
        <ThemeToggle />
        <Button type="primary" disabled title="Export lands in a later step">
          Export PDF
        </Button>
      </Space>
    </header>
  );
}
