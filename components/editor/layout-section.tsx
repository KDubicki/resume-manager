"use client";

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Tooltip } from "antd";
import { useId, useState, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  normalizeSidebarColumns,
  SIDEBAR_SECTION_LABELS,
  type ResumeContent,
  type SidebarColumns,
  type SidebarSectionKey,
} from "@/lib/schemas/resume";

import styles from "./layout-section.module.css";
import { SectionCard } from "./section-card";
import { columnOf, moveSection, type ColumnKey } from "./section-order-utils";
import { RowPreview, SortableRow } from "./sortable-row";

// Droppable ids for the columns themselves (so an empty column still accepts a
// drop). Prefixed so they can never collide with a section key.
const COLUMN_ID: Record<ColumnKey, string> = { left: "column:left", right: "column:right" };

function columnFromId(id: UniqueIdentifier): ColumnKey | null {
  if (id === COLUMN_ID.left) return "left";
  if (id === COLUMN_ID.right) return "right";
  return null;
}

function Column({
  column,
  keys,
  children,
}: {
  column: ColumnKey;
  keys: SidebarSectionKey[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: COLUMN_ID[column] });
  return (
    <SortableContext id={COLUMN_ID[column]} items={keys} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={styles.column} data-over={isOver || undefined}>
        <div className={styles.columnHead}>
          {column === "left" ? "Left column" : "Right column"}
        </div>
        {keys.length === 0 ? (
          <div className={styles.emptyHint}>Empty — drag a section here.</div>
        ) : (
          children
        )}
      </div>
    </SortableContext>
  );
}

export function LayoutSection() {
  const { control, setValue } = useFormContext<ResumeContent>();
  const watched = useWatch({ control, name: "sidebarColumns" });
  // Normalize so a section added after this resume was saved still shows up
  // (normalizeSidebarColumns appends any unplaced section to the right column).
  const columns = normalizeSidebarColumns(watched);

  // While dragging, a local draft carries cross-column moves (so the row jumps
  // into the other column under the pointer); it's committed once on drop, so
  // a drag is a single autosave and a single undo step.
  const [draft, setDraft] = useState<SidebarColumns | null>(null);
  const [dragging, setDragging] = useState<SidebarSectionKey | null>(null);
  const shown = draft ?? columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Deterministic ids for dnd-kit's a11y nodes (avoids a hydration mismatch).
  const dndId = useId();

  // setValue triggers the same form `watch` subscription the editor already
  // uses, so this persists via autosave and refreshes the live preview.
  const commit = (next: SidebarColumns) =>
    setValue("sidebarColumns", next, { shouldDirty: true, shouldTouch: true });

  // Where a drop over `overId` lands: a column's own area means "its end",
  // a row means "that row's slot".
  const target = (
    state: SidebarColumns,
    overId: UniqueIdentifier,
  ): { column: ColumnKey; index: number } | null => {
    const asColumn = columnFromId(overId);
    if (asColumn) return { column: asColumn, index: state[asColumn].length };
    const key = overId as SidebarSectionKey;
    const column = columnOf(state, key);
    return column ? { column, index: state[column].indexOf(key) } : null;
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !draft) return;
    const key = active.id as SidebarSectionKey;
    const to = target(draft, over.id);
    if (!to || to.column === columnOf(draft, key)) return;
    setDraft(moveSection(draft, key, to.column, to.index));
  };

  const endDrag = () => {
    setDraft(null);
    setDragging(null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const state = draft ?? columns;
    const key = active.id as SidebarSectionKey;
    const to = over ? target(state, over.id) : null;
    endDrag();
    if (!to) return;
    const next = moveSection(state, key, to.column, to.index);
    if (JSON.stringify(next) !== JSON.stringify(columns)) commit(next);
  };

  const renderRows = (column: ColumnKey, keys: SidebarSectionKey[]) =>
    keys.map((key, index) => {
      const label = SIDEBAR_SECTION_LABELS[key];
      const other: ColumnKey = column === "left" ? "right" : "left";
      return (
        <SortableRow key={key} id={key} label={label}>
          <Button
            type="text"
            size="small"
            aria-label={`Move ${label} up`}
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => commit(moveSection(columns, key, column, index - 1))}
          />
          <Button
            type="text"
            size="small"
            aria-label={`Move ${label} down`}
            icon={<ArrowDownOutlined />}
            disabled={index === keys.length - 1}
            onClick={() => commit(moveSection(columns, key, column, index + 1))}
          />
          <Tooltip title={`Move to ${other} column`}>
            <Button
              type="text"
              size="small"
              aria-label={`Move ${label} to ${other} column`}
              icon={column === "left" ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
              onClick={() => commit(moveSection(columns, key, other, columns[other].length))}
            />
          </Tooltip>
        </SortableRow>
      );
    });

  return (
    <SectionCard title="Sidebar layout">
      <p className={styles.note}>
        Drag sections to reorder them or move them between columns (Sidebar template only). The
        arrows do the same with a click.
      </p>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => {
          setDraft(columns);
          setDragging(active.id as SidebarSectionKey);
        }}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={endDrag}
      >
        <div className={styles.columns}>
          <Column column="left" keys={shown.left}>
            {renderRows("left", shown.left)}
          </Column>
          <Column column="right" keys={shown.right}>
            {renderRows("right", shown.right)}
          </Column>
        </div>
        <DragOverlay>
          {dragging ? <RowPreview label={SIDEBAR_SECTION_LABELS[dragging]} /> : null}
        </DragOverlay>
      </DndContext>
    </SectionCard>
  );
}
