"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input, Select } from "antd";
import { useMemo, useState } from "react";

import { ResumeCard } from "@/components/dashboard/resume-card";

import styles from "./resume-list.module.css";

export type ResumeListItem = {
  id: string;
  title: string;
  templateLabel: string;
  updatedAt: number;
  updatedLabel: string;
  completeness: number;
};

type SortKey = "updated-desc" | "updated-asc" | "title-asc" | "title-desc" | "template";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated-desc", label: "Last updated (newest)" },
  { value: "updated-asc", label: "Last updated (oldest)" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
  { value: "template", label: "Template" },
];

function sortResumes(resumes: ResumeListItem[], sort: SortKey): ResumeListItem[] {
  const sorted = [...resumes];
  switch (sort) {
    case "updated-asc":
      return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "template":
      return sorted.sort(
        (a, b) => a.templateLabel.localeCompare(b.templateLabel) || a.title.localeCompare(b.title),
      );
    case "updated-desc":
    default:
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export function ResumeList({ resumes }: { resumes: ResumeListItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated-desc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? resumes.filter(
          (resume) =>
            resume.title.toLowerCase().includes(q) ||
            resume.templateLabel.toLowerCase().includes(q),
        )
      : resumes;
    return sortResumes(filtered, sort);
  }, [resumes, query, sort]);

  return (
    <div>
      <div className={styles.toolbar}>
        <Input
          allowClear
          placeholder="Search by title or template"
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search resumes"
          className={styles.search}
        />
        <Select<SortKey>
          value={sort}
          onChange={setSort}
          options={SORT_OPTIONS}
          aria-label="Sort resumes"
          className={styles.sort}
        />
      </div>

      {visible.length === 0 ? (
        <Empty description="No resumes match your search" className={styles.emptyResult} />
      ) : (
        <div className={styles.grid}>
          {visible.map((resume) => (
            <ResumeCard
              key={resume.id}
              id={resume.id}
              title={resume.title}
              templateLabel={resume.templateLabel}
              updatedLabel={resume.updatedLabel}
              completeness={resume.completeness}
            />
          ))}
        </div>
      )}
    </div>
  );
}
