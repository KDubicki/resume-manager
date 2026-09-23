"use client";

import { HolderOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

import styles from "./sortable-row.module.css";

// One compact draggable row for the layout editors (section order, sidebar
// columns): a drag handle, a label, and optional actions (the arrow buttons,
// kept as a precise, keyboard-friendly alternative to dragging). Must render
// inside a dnd-kit SortableContext that lists `id`.
export function SortableRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children?: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={styles.row}
      data-dragging={isDragging || undefined}
    >
      <RowContent
        label={label}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            className={styles.handle}
            aria-label={`Drag to move ${label}`}
            {...attributes}
            {...listeners}
          >
            <HolderOutlined />
          </button>
        }
      >
        {children}
      </RowContent>
    </div>
  );
}

// The floating copy that follows the pointer (DragOverlay) — same look, no
// sortable wiring.
export function RowPreview({ label }: { label: string }) {
  return (
    <div className={`${styles.row} ${styles.overlay}`}>
      <RowContent
        label={label}
        handle={
          <span className={styles.handle} aria-hidden="true">
            <HolderOutlined />
          </span>
        }
      />
    </div>
  );
}

function RowContent({
  label,
  handle,
  children,
}: {
  label: string;
  handle: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      {handle}
      <span className={styles.label}>{label}</span>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </>
  );
}
