"use client";

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
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

type ColumnKey = "left" | "right";

export function LayoutSection() {
  const { control, setValue } = useFormContext<ResumeContent>();
  const watched = useWatch({ control, name: "sidebarColumns" });
  // Normalize so a section added after this resume was saved still shows up
  // (normalizeSidebarColumns appends any unplaced section to the right column).
  const columns = normalizeSidebarColumns(watched);

  // setValue triggers the same form `watch` subscription the editor already
  // uses, so this persists via autosave and refreshes the live preview with no
  // extra wiring.
  const commit = (next: SidebarColumns) =>
    setValue("sidebarColumns", next, { shouldDirty: true, shouldTouch: true });

  const moveWithin = (column: ColumnKey, index: number, direction: -1 | 1) => {
    const arr = [...columns[column]];
    const target = index + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target]!, arr[index]!];
    commit({ ...columns, [column]: arr });
  };

  const moveToOther = (from: ColumnKey, index: number) => {
    const to: ColumnKey = from === "left" ? "right" : "left";
    const fromArr = [...columns[from]];
    const [key] = fromArr.splice(index, 1);
    commit({ ...columns, [from]: fromArr, [to]: [...columns[to], key!] });
  };

  const renderColumn = (column: ColumnKey, keys: SidebarSectionKey[]) => (
    <div className={styles.column}>
      <div className={styles.columnHead}>{column === "left" ? "Left column" : "Right column"}</div>
      {keys.length === 0 ? (
        <div className={styles.emptyHint}>Empty — move a section here.</div>
      ) : (
        keys.map((key, index) => (
          <div key={key} className={styles.item}>
            <span className={styles.itemLabel}>{SIDEBAR_SECTION_LABELS[key]}</span>
            <div className={styles.itemActions}>
              <Button
                type="text"
                size="small"
                aria-label={`Move ${SIDEBAR_SECTION_LABELS[key]} up`}
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => moveWithin(column, index, -1)}
              />
              <Button
                type="text"
                size="small"
                aria-label={`Move ${SIDEBAR_SECTION_LABELS[key]} down`}
                icon={<ArrowDownOutlined />}
                disabled={index === keys.length - 1}
                onClick={() => moveWithin(column, index, 1)}
              />
              <Tooltip title={column === "left" ? "Move to right column" : "Move to left column"}>
                <Button
                  type="text"
                  size="small"
                  aria-label={`Move ${SIDEBAR_SECTION_LABELS[key]} to ${column === "left" ? "right" : "left"} column`}
                  icon={column === "left" ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
                  onClick={() => moveToOther(column, index)}
                />
              </Tooltip>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <SectionCard title="Sidebar layout">
      <p className={styles.note}>
        Arrange which column each section appears in (Sidebar template only). Reorder within a column
        with the arrows, or send a section across with →/←.
      </p>
      <div className={styles.columns}>
        {renderColumn("left", columns.left)}
        {renderColumn("right", columns.right)}
      </div>
    </SectionCard>
  );
}
