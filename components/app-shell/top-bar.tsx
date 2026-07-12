"use client";

import { Button, Space, Typography } from "antd";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import { SaveIndicator, type SaveStatus } from "./save-indicator";
import styles from "./top-bar.module.css";

export function TopBar({
  title,
  onTitleChange,
  saveStatus,
  lastSavedAt,
  onRetrySave,
  onExport,
  exporting,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  onRetrySave?: () => void;
  onExport: () => void;
  exporting: boolean;
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
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} onRetry={onRetrySave} />
        <ThemeToggle />
        <Button type="primary" loading={exporting} onClick={onExport}>
          Export PDF
        </Button>
      </Space>
    </header>
  );
}
