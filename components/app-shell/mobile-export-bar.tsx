"use client";

import { Button } from "antd";

import styles from "./mobile-export-bar.module.css";

export function MobileExportBar({
  onExport,
  exporting,
}: {
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className={styles.bar}>
      <Button type="primary" block size="large" loading={exporting} onClick={onExport}>
        Export PDF
      </Button>
    </div>
  );
}
