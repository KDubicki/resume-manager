"use client";

import { Segmented } from "antd";
import { useState } from "react";

import { MobileExportBar } from "./mobile-export-bar";
import styles from "./workbench-shell.module.css";

type Pane = "edit" | "preview";

export function WorkbenchShell({
  editor,
  preview,
}: {
  editor: React.ReactNode;
  preview: React.ReactNode;
}) {
  const [activePane, setActivePane] = useState<Pane>("edit");

  return (
    <div className={styles.shell} data-active-pane={activePane}>
      <div className={styles.mobileToggle}>
        <Segmented
          block
          value={activePane}
          onChange={(value) => setActivePane(value as Pane)}
          options={[
            { label: "Edit", value: "edit" },
            { label: "Preview", value: "preview" },
          ]}
        />
      </div>
      <div className={`${styles.pane} ${styles.editorPane}`}>{editor}</div>
      <div className={`${styles.pane} ${styles.previewPane}`}>{preview}</div>
      <MobileExportBar />
    </div>
  );
}
