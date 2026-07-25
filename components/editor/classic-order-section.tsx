"use client";

import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useFormContext, useWatch } from "react-hook-form";

import {
  normalizeClassicOrder,
  TOGGLEABLE_SECTION_LABELS,
  type ResumeContent,
} from "@/lib/schemas/resume";

import styles from "./classic-order-section.module.css";
import { SectionCard } from "./section-card";

export function ClassicOrderSection() {
  const { control, setValue } = useFormContext<ResumeContent>();
  // Normalize so a section added after this resume was saved still shows up
  // (normalizeClassicOrder de-dupes and appends any missing section).
  const order = normalizeClassicOrder(useWatch({ control, name: "classicOrder" }) ?? []);
  // Hidden sections are managed by the visibility toggles above and don't
  // print, so they're dropped from this list entirely. Their position is still
  // preserved in `order` (the full array), so unhiding restores them in place.
  const hidden = new Set(useWatch({ control, name: "hiddenSections" }) ?? []);
  const visible = order.filter((key) => !hidden.has(key));

  // setValue drives the same form `watch` the editor already listens to, so a
  // reorder autosaves and refreshes the live preview with no extra wiring. We
  // move within the visible list but swap the sections' slots in the FULL order
  // array, so a hidden section sitting between two visible ones keeps its spot.
  const move = (visibleIndex: number, direction: -1 | 1) => {
    const target = visibleIndex + direction;
    if (target < 0 || target >= visible.length) return;
    const arr = [...order];
    const a = arr.indexOf(visible[visibleIndex]!);
    const b = arr.indexOf(visible[target]!);
    [arr[a], arr[b]] = [arr[b]!, arr[a]!];
    setValue("classicOrder", arr, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <SectionCard title="Section order">
      <p className={styles.note}>
        Reorder the sections of the single-column templates (Classic, Modern, Minimal). Empty
        sections keep their place but don&apos;t print; hidden sections don&apos;t appear here.
      </p>
      <div className={styles.list}>
        {visible.map((key, index) => {
          const label = TOGGLEABLE_SECTION_LABELS[key];
          return (
            <div key={key} className={styles.item}>
              <span className={styles.itemLabel}>
                {index + 1}. {label}
              </span>
              <div className={styles.itemActions}>
                <Button
                  type="text"
                  size="small"
                  aria-label={`Move ${label} up`}
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <Button
                  type="text"
                  size="small"
                  aria-label={`Move ${label} down`}
                  icon={<ArrowDownOutlined />}
                  disabled={index === visible.length - 1}
                  onClick={() => move(index, 1)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
