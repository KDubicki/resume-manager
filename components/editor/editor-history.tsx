"use client";

import { RedoOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

import styles from "./editor-history.module.css";
import type { FormHistory } from "./use-form-history";

export function EditorHistory({ undo, redo, canUndo, canRedo }: FormHistory) {
  return (
    <div className={styles.bar}>
      <Tooltip title="Undo (⌘/Ctrl+Z)">
        <Button
          size="small"
          icon={<UndoOutlined />}
          disabled={!canUndo}
          onClick={undo}
          aria-label="Undo"
        />
      </Tooltip>
      <Tooltip title="Redo (⌘/Ctrl+Shift+Z)">
        <Button
          size="small"
          icon={<RedoOutlined />}
          disabled={!canRedo}
          onClick={redo}
          aria-label="Redo"
        />
      </Tooltip>
    </div>
  );
}
