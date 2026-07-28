"use client";

import { HolderOutlined } from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { App, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { setApplicationStatus } from "@/lib/actions/application";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/lib/schemas/application";

import { ApplicationActions } from "./application-actions";
import styles from "./application-kanban.module.css";
import type { ApplicationItem } from "./application-filters";
import { STATUS_COLORS } from "./status-colors";

function isStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function KanbanCard({
  application,
  onEdit,
}: {
  application: ApplicationItem;
  onEdit: (application: ApplicationItem) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: application.id,
  });
  const label = `${application.role} at ${application.company}`;

  return (
    // The whole card is the pointer drag target — grabbing a card anywhere is
    // what makes a board feel like a board. Nested buttons and links still
    // work: the mouse sensor needs 4px of travel before a press becomes a
    // drag, so a plain click reaches them.
    <div
      ref={setNodeRef}
      className={styles.card}
      data-dragging={isDragging || undefined}
      {...listeners}
    >
      {/* Keyboard users need a focusable activator, which the card itself
          can't be without wrapping nested controls in a role="button". This
          one is invisible until focused. */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={styles.handle}
        aria-label={`Drag ${label} to another stage`}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </button>
      <div className={styles.cardTitle}>
        <span className={styles.company}>{application.company}</span>
        <span className={styles.role}>{application.role}</span>
      </div>
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
          <span className={styles.noResume}>No resume</span>
        )}
      </div>
      {/* Actions sit on their own row: five columns on one screen leaves no
          room for three icon buttons next to the company name. */}
      <div className={styles.cardFooter}>
        <ApplicationActions application={application} onEdit={onEdit} />
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  applications,
  onEdit,
}: {
  status: ApplicationStatus;
  applications: ApplicationItem[];
  onEdit: (application: ApplicationItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className={styles.column} aria-label={APPLICATION_STATUS_LABELS[status]}>
      <header className={styles.columnHead}>
        <Tag color={STATUS_COLORS[status]} className={styles.columnTag}>
          {APPLICATION_STATUS_LABELS[status]}
        </Tag>
        <span className={`font-mono ${styles.count}`}>{applications.length}</span>
      </header>
      <div ref={setNodeRef} className={styles.dropZone} data-over={isOver || undefined}>
        {applications.map((application) => (
          <KanbanCard key={application.id} application={application} onEdit={onEdit} />
        ))}
        {applications.length === 0 ? <p className={styles.emptyColumn}>Drop here</p> : null}
      </div>
    </section>
  );
}

/**
 * Stage-per-column view of the same applications the list shows. Dropping a
 * card writes the new stage through `setApplicationStatus`, so the funnel is
 * edited by dragging rather than by opening each row. Order *within* a column
 * comes from the active sort — there's no persisted per-column position.
 */
export function ApplicationKanban({
  applications,
  onEdit,
}: {
  applications: ApplicationItem[];
  onEdit: (application: ApplicationItem) => void;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  // Stage moves are applied locally the moment the card is dropped, so the
  // card doesn't snap back while the Server Action and the refresh are in
  // flight.
  const [optimistic, setOptimistic] = useState<Record<string, ApplicationStatus>>({});
  const [dragging, setDragging] = useState<ApplicationItem | null>(null);
  const dndId = useId();

  // Mouse and touch are split deliberately. A mouse drag starts after 4px of
  // travel, so clicks on the card's buttons still land. Touch waits for a
  // 250ms press instead, so swiping across a card scrolls the board rather
  // than dragging the card.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  // An optimistic entry only counts while it still disagrees with the server;
  // once the refreshed props catch up it's inert, so nothing has to prune it.
  const stageOf = (application: ApplicationItem): ApplicationStatus =>
    optimistic[application.id] ?? application.status;

  const columns = useMemo(
    () =>
      APPLICATION_STATUSES.map((status) => ({
        status,
        items: applications.filter(
          (application) => (optimistic[application.id] ?? application.status) === status,
        ),
      })),
    [applications, optimistic],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDragging(applications.find((application) => application.id === event.active.id) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;

    const target = String(over.id);
    if (!isStatus(target)) return;

    const application = applications.find((item) => item.id === active.id);
    if (!application) return;

    if (stageOf(application) === target) return;

    setOptimistic((current) => ({ ...current, [application.id]: target }));

    // On failure the card belongs back where the server still has it.
    const revert = () =>
      setOptimistic((current) => ({ ...current, [application.id]: application.status }));

    try {
      const { ok } = await setApplicationStatus(application.id, target);
      if (!ok) {
        revert();
        message.error("Couldn't update that stage — try again.");
        return;
      }
      message.success(
        `${application.role} at ${application.company} → ${APPLICATION_STATUS_LABELS[target]}`,
      );
      router.refresh();
    } catch {
      revert();
      message.error("Couldn't update that stage — try again.");
    }
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      // Columns are large drop targets containing the cards, so hit-testing on
      // the pointer beats center-distance: dropping onto a tall column with one
      // card at the top must still register as that column.
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={(event) => void handleDragEnd(event)}
      onDragCancel={() => setDragging(null)}
    >
      <div className={styles.board}>
        {columns.map(({ status, items }) => (
          <KanbanColumn key={status} status={status} applications={items} onEdit={onEdit} />
        ))}
      </div>
      <DragOverlay>
        {dragging ? (
          <div className={`${styles.card} ${styles.overlayCard}`}>
            <div className={styles.cardTitle}>
              <span className={styles.company}>{dragging.company}</span>
              <span className={styles.role}>{dragging.role}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
