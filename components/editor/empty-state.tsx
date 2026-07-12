"use client";

import { Button, Typography } from "antd";

import styles from "./empty-state.module.css";

export function EmptyState({ onNewResume }: { onNewResume: () => void }) {
  return (
    <div className={styles.wrap}>
      <Typography.Title level={2} className="font-display" style={{ marginBottom: 8 }}>
        Two readers. One resume.
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ maxWidth: 420, marginBottom: 24 }}>
        Start one and see it the way a recruiter — and a parser — will.
      </Typography.Paragraph>
      <Button type="primary" size="large" onClick={onNewResume}>
        New resume
      </Button>
    </div>
  );
}
