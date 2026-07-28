"use client";

import { DeleteOutlined, EditOutlined, LinkOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteApplication } from "@/lib/actions/application";

import styles from "./application-actions.module.css";
import type { ApplicationItem } from "./application-filters";

/**
 * The open-posting / edit / delete trio shared by the list card and the kanban
 * card, so the delete flow (and its confirm copy) exists once.
 */
export function ApplicationActions({
  application,
  onEdit,
}: {
  application: ApplicationItem;
  onEdit: (application: ApplicationItem) => void;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [deleting, setDeleting] = useState(false);

  const label = `${application.role} at ${application.company}`;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { ok } = await deleteApplication(application.id);
      if (!ok) {
        message.error("Couldn't delete that application — try again.");
        return;
      }
      message.success(`Stopped tracking ${label}`);
      router.refresh();
    } catch {
      message.error("Couldn't delete that application — try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.actions}>
      {application.jobUrl ? (
        <Tooltip title="Open the posting">
          <Button
            type="text"
            size="small"
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open the posting for ${label}`}
            icon={<LinkOutlined />}
          />
        </Tooltip>
      ) : null}
      <Tooltip title="Edit">
        <Button
          type="text"
          size="small"
          aria-label={`Edit ${label}`}
          icon={<EditOutlined />}
          onClick={() => onEdit(application)}
        />
      </Tooltip>
      <Popconfirm
        title="Stop tracking?"
        description="The application is deleted. The resume stays."
        okText="Delete"
        okButtonProps={{ danger: true, loading: deleting }}
        cancelText="Cancel"
        onConfirm={handleDelete}
      >
        <Button
          type="text"
          size="small"
          aria-label={`Delete ${label}`}
          icon={<DeleteOutlined />}
          className={styles.deleteButton}
        />
      </Popconfirm>
    </div>
  );
}
