"use client";

import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteResumePermanently, restoreResume } from "@/lib/actions/resume";

import styles from "./trash-card.module.css";

export function TrashCard({
  id,
  title,
  templateLabel,
  deletedLabel,
}: {
  id: string;
  title: string;
  templateLabel: string;
  deletedLabel: string;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const { ok } = await restoreResume(id);
      if (!ok) {
        message.error("Couldn't restore that resume — try again.");
        return;
      }
      message.success(`Restored "${title}"`);
      router.refresh();
    } catch {
      message.error("Couldn't restore that resume — try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    try {
      const { ok } = await deleteResumePermanently(id);
      if (!ok) {
        message.error("Couldn't delete that resume — try again.");
        return;
      }
      message.success(`Permanently deleted "${title}"`);
      router.refresh();
    } catch {
      message.error("Couldn't delete that resume — try again.");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className={styles.card}>
      <span className={styles.badge}>{templateLabel}</span>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.cardMeta}>Deleted {deletedLabel}</div>
      <div className={styles.actions}>
        <Button size="small" icon={<UndoOutlined />} loading={restoring} onClick={handleRestore}>
          Restore
        </Button>
        <Popconfirm
          title="Delete forever?"
          description="This can't be undone."
          okText="Delete forever"
          okButtonProps={{ danger: true, loading: purging }}
          cancelText="Cancel"
          onConfirm={handlePurge}
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            Delete forever
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
