"use client";

import { DeleteOutlined, EditOutlined, LinkOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Select, Tag, Tooltip } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteApplication, setApplicationStatus } from "@/lib/actions/application";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/schemas/application";

import type { ApplicationItem } from "./application-filters";
import styles from "./application-card.module.css";

// antd preset colors, mapped to the funnel: neutral until sent, warm while
// live, green on an offer, red on a no.
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "default",
  APPLIED: "blue",
  INTERVIEW: "gold",
  OFFER: "green",
  REJECTED: "red",
};

export function ApplicationCard({
  application,
  onEdit,
}: {
  application: ApplicationItem;
  onEdit: (application: ApplicationItem) => void;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const label = `${application.role} at ${application.company}`;

  const handleStatusChange = async (status: ApplicationStatus) => {
    setUpdating(true);
    try {
      const { ok } = await setApplicationStatus(application.id, status);
      if (!ok) {
        message.error("Couldn't update that stage — try again.");
        return;
      }
      message.success(`${label} → ${APPLICATION_STATUS_LABELS[status]}`);
      router.refresh();
    } catch {
      message.error("Couldn't update that stage — try again.");
    } finally {
      setUpdating(false);
    }
  };

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
    <div className={styles.card}>
      <div className={styles.head}>
        <Tag color={STATUS_COLORS[application.status]} className={styles.tag}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </Tag>
        <div className={styles.headActions}>
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
      </div>

      <h2 className={styles.company}>{application.company}</h2>
      <div className={styles.role}>{application.role}</div>

      <div className={styles.meta}>
        <span>
          {application.appliedLabel
            ? `Applied ${application.appliedLabel}`
            : `Updated ${application.updatedLabel}`}
        </span>
        {application.resumeId ? (
          <Link href={`/resume/${application.resumeId}`} className={styles.resumeLink}>
            {application.resumeTitle}
          </Link>
        ) : (
          <span className={styles.noResume}>No resume linked</span>
        )}
      </div>

      {application.notes ? <p className={styles.notes}>{application.notes}</p> : null}

      <Select<ApplicationStatus>
        size="small"
        value={application.status}
        onChange={(status) => void handleStatusChange(status)}
        options={APPLICATION_STATUS_OPTIONS}
        loading={updating}
        aria-label={`Stage for ${label}`}
        className={styles.stageSelect}
      />
    </div>
  );
}
