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

  // setValue drives the same form `watch` the editor already listens to, so a
  // reorder autosaves and refreshes the live preview with no extra wiring.
  const move = (index: number, direction: -1 | 1) => {
    const arr = [...order];
    const target = index + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target]!, arr[index]!];
    setValue("classicOrder", arr, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <SectionCard title="Section order">
      <p className={styles.note}>
        Reorder the sections of the single-column templates (Classic, Modern, Minimal). Empty or
        hidden sections keep their place but don&apos;t print.
      </p>
      <div className={styles.list}>
        {order.map((key, index) => {
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
                  disabled={index === order.length - 1}
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
