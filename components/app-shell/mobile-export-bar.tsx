"use client";

import { Button } from "antd";

import styles from "./mobile-export-bar.module.css";

export function MobileExportBar() {
  return (
    <div className={styles.bar}>
      <Button type="primary" block size="large" disabled title="Export lands in a later step">
        Export PDF
      </Button>
    </div>
  );
}
