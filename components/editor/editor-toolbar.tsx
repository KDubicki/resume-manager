"use client";

import {
  BgColorsOutlined,
  EllipsisOutlined,
  FormOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Segmented } from "antd";

import { EditorHistory } from "./editor-history";
import styles from "./editor-toolbar.module.css";
import type { FormHistory } from "./use-form-history";

export type EditorMode = "content" | "design";

// Top strip of the editor (DS-5): what-it-says vs. how-it-looks, undo/redo, and
// rare actions tucked into an overflow menu.
export function EditorToolbar({
  mode,
  onModeChange,
  history,
  onImportClick,
}: {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  history: FormHistory;
  onImportClick: () => void;
}) {
  return (
    <div className={styles.bar}>
      <Segmented<EditorMode>
        value={mode}
        onChange={onModeChange}
        aria-label="Editor mode"
        options={[
          { value: "content", label: "Content", icon: <FormOutlined /> },
          { value: "design", label: "Design", icon: <BgColorsOutlined /> },
        ]}
      />
      <div className={styles.actions}>
        <EditorHistory {...history} />
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "import", icon: <UploadOutlined />, label: "Replace content from JSON…" },
            ],
            onClick: ({ key }) => {
              if (key === "import") onImportClick();
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} aria-label="More actions" />
        </Dropdown>
      </div>
    </div>
  );
}
