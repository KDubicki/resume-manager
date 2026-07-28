"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Segmented, Select } from "antd";
import { useMemo, useState } from "react";

import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES } from "@/lib/schemas/application";

import { ApplicationCard } from "./application-card";
import styles from "./application-board.module.css";
import {
  APPLICATION_SORT_OPTIONS,
  countByStatus,
  filterAndSortApplications,
  type ApplicationItem,
  type ApplicationSortKey,
  type StatusFilter,
} from "./application-filters";
import { ApplicationFormModal, type ResumeOption } from "./application-form-modal";

export function ApplicationBoard({
  applications,
  resumes,
}: {
  applications: ApplicationItem[];
  resumes: ResumeOption[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<ApplicationSortKey>("updated-desc");
  // `null` while open means "create"; the modal is shared by both paths so the
  // validation and field set can't drift between adding and editing.
  const [editing, setEditing] = useState<ApplicationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const counts = useMemo(() => countByStatus(applications), [applications]);
  const visible = useMemo(
    () => filterAndSortApplications(applications, { query, status, sort }),
    [applications, query, status, sort],
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (application: ApplicationItem) => {
    setEditing(application);
    setModalOpen(true);
  };

  const filterOptions = [
    { value: "ALL" as StatusFilter, label: `All (${counts.ALL})` },
    ...APPLICATION_STATUSES.map((stage) => ({
      value: stage as StatusFilter,
      label: `${APPLICATION_STATUS_LABELS[stage]} (${counts[stage]})`,
    })),
  ];

  return (
    <div>
      <div className={styles.toolbar}>
        <Input
          allowClear
          placeholder="Search company, role, resume or notes"
          prefix={<SearchOutlined />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search applications"
          className={styles.search}
        />
        <Select<ApplicationSortKey>
          value={sort}
          onChange={setSort}
          options={APPLICATION_SORT_OPTIONS}
          aria-label="Sort applications"
          className={styles.sort}
        />
        <Button type="primary" onClick={openCreate}>
          Track application
        </Button>
      </div>

      <Segmented<StatusFilter>
        value={status}
        onChange={setStatus}
        options={filterOptions}
        className={styles.stages}
        aria-label="Filter by stage"
      />

      {visible.length === 0 ? (
        <Empty
          description={
            applications.length === 0
              ? "Nothing tracked yet — add the first role you're chasing."
              : "No applications match these filters"
          }
          className={styles.emptyResult}
        >
          {applications.length === 0 ? (
            <Button type="primary" onClick={openCreate}>
              Track application
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className={styles.grid}>
          {visible.map((application) => (
            <ApplicationCard key={application.id} application={application} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ApplicationFormModal
        open={modalOpen}
        application={editing}
        resumes={resumes}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
