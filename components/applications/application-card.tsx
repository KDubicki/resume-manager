"use client";

import { App, Select, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setApplicationStatus } from "@/lib/actions/application";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/schemas/application";

import { ApplicationActions } from "./application-actions";
import styles from "./application-card.module.css";
import type { ApplicationItem } from "./application-filters";
import { STATUS_COLORS } from "./status-colors";

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

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <Tag color={STATUS_COLORS[application.status]} className={styles.tag}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </Tag>
        <ApplicationActions application={application} onEdit={onEdit} />
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
