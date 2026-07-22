"use client";

import { BulbOutlined } from "@ant-design/icons";
import { Button } from "antd";

import styles from "./section-empty-state.module.css";

// Empty-state prompt for a section with no entries (UX-5): a short hint plus an
// "Add sample" action that drops in a realistic example.
export function SectionEmptyState({
  hint,
  onAddSample,
  sampleLabel = "Add sample",
}: {
  hint: string;
  onAddSample: () => void;
  sampleLabel?: string;
}) {
  return (
    <div className={styles.empty}>
      <p className={styles.hint}>{hint}</p>
      <Button size="small" icon={<BulbOutlined />} onClick={onAddSample}>
        {sampleLabel}
      </Button>
    </div>
  );
}
