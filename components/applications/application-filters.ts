import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/schemas/application";

export type ApplicationItem = {
  id: string;
  company: string;
  role: string;
  jobUrl: string;
  jobDescription: string;
  notes: string;
  status: ApplicationStatus;
  resumeId: string | null;
  resumeTitle: string | null;
  /** Epoch ms — sorting key; the display strings are formatted on the server. */
  updatedAt: number;
  appliedAt: number | null;
  updatedLabel: string;
  appliedLabel: string | null;
};

export type ApplicationSortKey = "updated-desc" | "applied-desc" | "company-asc" | "status";

export const APPLICATION_SORT_OPTIONS: { value: ApplicationSortKey; label: string }[] = [
  { value: "updated-desc", label: "Last updated (newest)" },
  { value: "applied-desc", label: "Applied (newest)" },
  { value: "company-asc", label: "Company (A–Z)" },
  { value: "status", label: "Stage" },
];

export type StatusFilter = ApplicationStatus | "ALL";

// Pipeline order, not alphabetical: sorting by stage should read like the
// funnel does (saved → applied → interview → offer → rejected).
const STATUS_RANK: Record<ApplicationStatus, number> = APPLICATION_STATUSES.reduce(
  (rank, status, index) => ({ ...rank, [status]: index }),
  {} as Record<ApplicationStatus, number>,
);

function matchesQuery(application: ApplicationItem, query: string): boolean {
  return [
    application.company,
    application.role,
    application.resumeTitle ?? "",
    application.notes,
  ].some((field) => field.toLowerCase().includes(query));
}

/**
 * Filter + sort in one pass so the list component stays presentational (and so
 * this logic is testable without rendering antd).
 */
export function filterAndSortApplications(
  applications: ApplicationItem[],
  { query, status, sort }: { query: string; status: StatusFilter; sort: ApplicationSortKey },
): ApplicationItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = applications.filter(
    (application) =>
      (status === "ALL" || application.status === status) &&
      (normalizedQuery === "" || matchesQuery(application, normalizedQuery)),
  );

  const sorted = [...filtered];
  switch (sort) {
    case "applied-desc":
      // Never-sent applications sink to the bottom rather than sorting as
      // "oldest" — they aren't waiting on anyone.
      return sorted.sort(
        (a, b) =>
          (b.appliedAt ?? -Infinity) - (a.appliedAt ?? -Infinity) || b.updatedAt - a.updatedAt,
      );
    case "company-asc":
      return sorted.sort(
        (a, b) => a.company.localeCompare(b.company) || a.role.localeCompare(b.role),
      );
    case "status":
      return sorted.sort(
        (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.updatedAt - a.updatedAt,
      );
    case "updated-desc":
    default:
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

/** Per-stage counts for the filter chips, including the "All" total. */
export function countByStatus(applications: ApplicationItem[]): Record<StatusFilter, number> {
  const counts = APPLICATION_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {
    ALL: applications.length,
  } as Record<StatusFilter, number>);
  for (const application of applications) {
    counts[application.status] += 1;
  }
  return counts;
}
