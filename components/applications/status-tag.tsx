import type { ApplicationStatus } from "@/lib/schemas/application";
import { APPLICATION_STATUS_LABELS } from "@/lib/schemas/application";

import styles from "./status-tag.module.css";

// A stage label in the product palette (DS-8), shared by the list card and the
// kanban column heads so a stage looks the same everywhere. The stage color is
// carried by a dot + tint while the text keeps the normal ink, so every stage
// stays readable (brass or brick as small text would fail contrast) and a
// rejection reads as a fact, not an alarm.
export function StatusTag({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span className={`${styles.tag} ${className ?? ""}`} data-status={status}>
      <span className={styles.dot} aria-hidden="true" />
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
