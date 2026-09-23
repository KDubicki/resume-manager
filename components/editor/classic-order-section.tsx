"use client";

import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "antd";
import { useId, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  normalizeClassicOrder,
  TOGGLEABLE_SECTION_LABELS,
  type ClassicSectionKey,
  type ResumeContent,
} from "@/lib/schemas/resume";

import styles from "./classic-order-section.module.css";
import { SectionCard } from "./section-card";
import { reorderVisible } from "./section-order-utils";
import { RowPreview, SortableRow } from "./sortable-row";

export function ClassicOrderSection() {
  const { control, setValue } = useFormContext<ResumeContent>();
  // Normalize so a section added after this resume was saved still shows up
  // (normalizeClassicOrder de-dupes and appends any missing section).
  const order = normalizeClassicOrder(useWatch({ control, name: "classicOrder" }) ?? []);
  // Hidden sections are managed by the visibility toggles above and don't
  // print, so they're dropped from this list entirely. Their position is still
  // preserved in `order` (the full array), so unhiding restores them in place.
  const hidden = new Set<string>(useWatch({ control, name: "hiddenSections" }) ?? []);
  const visible = order.filter((key) => !hidden.has(key));
  const [dragging, setDragging] = useState<ClassicSectionKey | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Deterministic ids for dnd-kit's a11y nodes (avoids a hydration mismatch).
  const dndId = useId();

  // setValue drives the same form `watch` the editor already listens to, so a
  // reorder autosaves and refreshes the live preview with no extra wiring.
  // Dragging and the arrows both go through reorderVisible, which keeps any
  // hidden section in its slot of the full order.
  const move = (from: number, to: number) => {
    if (to < 0 || to >= visible.length) return;
    setValue("classicOrder", reorderVisible(order, hidden, from, to), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over || active.id === over.id) return;
    move(
      visible.indexOf(active.id as ClassicSectionKey),
      visible.indexOf(over.id as ClassicSectionKey),
    );
  };

  return (
    <SectionCard title="Section order">
      <p className={styles.note}>
        Drag sections to reorder the single-column templates (Classic, Modern, Minimal), or use the
        arrows. Empty sections keep their place but don&apos;t print; hidden sections don&apos;t
        appear here.
      </p>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={({ active }) => setDragging(active.id as ClassicSectionKey)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <SortableContext items={visible} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {visible.map((key, index) => {
              const label = TOGGLEABLE_SECTION_LABELS[key];
              return (
                <SortableRow key={key} id={key} label={`${index + 1}. ${label}`}>
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Move ${label} up`}
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Move ${label} down`}
                    icon={<ArrowDownOutlined />}
                    disabled={index === visible.length - 1}
                    onClick={() => move(index, index + 1)}
                  />
                </SortableRow>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {dragging ? (
            <RowPreview
              label={`${visible.indexOf(dragging) + 1}. ${TOGGLEABLE_SECTION_LABELS[dragging]}`}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </SectionCard>
  );
}
