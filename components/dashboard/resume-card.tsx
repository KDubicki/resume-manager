"use client";

import { CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Tooltip } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteResume, duplicateResume } from "@/lib/actions/resume";

import styles from "./resume-card.module.css";

export function ResumeCard({
  id,
  title,
  templateLabel,
  updatedLabel,
}: {
  id: string;
  title: string;
  templateLabel: string;
  updatedLabel: string;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const result = await duplicateResume(id);
      if (!result.ok) {
        message.error("Couldn't duplicate that resume — try again.");
        return;
      }
      message.success(`Duplicated "${title}"`);
      router.refresh();
    } catch {
      message.error("Couldn't duplicate that resume — try again.");
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { ok } = await deleteResume(id);
      if (!ok) {
        message.error("Couldn't delete that resume — try again.");
        return;
      }
      message.success(`Deleted "${title}"`);
      // Re-run the dashboard server component so the card disappears.
      router.refresh();
    } catch {
      message.error("Couldn't delete that resume — try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.card}>
      {/* The navigation link and the delete button are siblings, not nested,
          so there's no interactive-inside-anchor issue. */}
      <Link href={`/resume/${id}`} className={styles.cardLink}>
        <span className={styles.badge}>{templateLabel}</span>
        <h2 className={styles.cardTitle}>{title}</h2>
        <div className={styles.cardMeta}>Updated {updatedLabel}</div>
      </Link>
      <div className={styles.cardActions}>
        <Tooltip title="Duplicate">
          <Button
            type="text"
            size="small"
            aria-label={`Duplicate ${title}`}
            icon={<CopyOutlined />}
            loading={duplicating}
            onClick={handleDuplicate}
          />
        </Tooltip>
        <Popconfirm
          title="Delete this resume?"
          description="This can't be undone."
          okText="Delete"
          okButtonProps={{ danger: true, loading: deleting }}
          cancelText="Cancel"
          onConfirm={handleDelete}
        >
          <Button
            type="text"
            size="small"
            aria-label={`Delete ${title}`}
            icon={<DeleteOutlined />}
            className={styles.deleteButton}
          />
        </Popconfirm>
      </div>
    </div>
  );
}
