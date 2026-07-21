"use client";

import { HolderOutlined } from "@ant-design/icons";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, type ReactNode } from "react";

import styles from "./sortable-entry-list.module.css";

// Reusable drag-and-drop wrapper for the editor's repeatable-entry sections
// (experience/education/projects — UX-1). Reordering is driven by the caller's
// useFieldArray `move(from, to)`, so a drag autosaves and refreshes the live
// preview through the same form `watch` as any other edit — no extra wiring.
export function SortableEntryList({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (from: number, to: number) => void;
  children: ReactNode;
}) {
  // A small activation distance so a click on a field inside the entry isn't
  // swallowed as a drag; the keyboard sensor makes reordering fully accessible.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // dnd-kit derives its accessibility description ids from a module-level
  // counter unless DndContext is given an explicit id, which produces a
  // server/client hydration mismatch. React's useId is SSR-consistent and
  // unique per instance, so it makes those ids deterministic.
  const dndId = useId();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(from, to);
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// One draggable entry: the bordered card, a drag handle, and the caller's field
// markup. `id` must be the same stable id used as the React key and in the
// `ids` array above (useFieldArray's field id).
export function SortableEntry({
  id,
  label,
  children,
}: {
  id: string;
  label?: string;
  children: ReactNode;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.entry}
      data-dragging={isDragging || undefined}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={styles.handle}
        aria-label={label ? `Drag to reorder ${label}` : "Drag to reorder"}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </button>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
