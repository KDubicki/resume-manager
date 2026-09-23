import type { SidebarColumns, SidebarSectionKey } from "@/lib/schemas/resume";

// Pure reorder helpers for the two layout editors (drag-and-drop and the arrow
// buttons share them), kept out of the components so they're unit-testable.

function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/**
 * Moves a section within the *visible* list (hidden ones aren't shown) and
 * writes the result back into the full order, leaving every hidden section in
 * the exact slot it had — so unhiding it later restores it where it was.
 */
export function reorderVisible<K extends string>(
  order: readonly K[],
  hidden: ReadonlySet<string>,
  from: number,
  to: number,
): K[] {
  const visible = order.filter((key) => !hidden.has(key));
  if (from === to || from < 0 || to < 0 || from >= visible.length || to >= visible.length) {
    return [...order];
  }
  const moved = arrayMove(visible, from, to);
  let next = 0;
  return order.map((key) => (hidden.has(key) ? key : moved[next++]!));
}

export type ColumnKey = keyof SidebarColumns;

export function columnOf(columns: SidebarColumns, key: SidebarSectionKey): ColumnKey | null {
  if (columns.left.includes(key)) return "left";
  if (columns.right.includes(key)) return "right";
  return null;
}

/**
 * Moves `key` to `toColumn` at `toIndex` (clamped), whether that's a reorder
 * within its own column or a move across. Returns the input unchanged when
 * the key isn't placed.
 */
export function moveSection(
  columns: SidebarColumns,
  key: SidebarSectionKey,
  toColumn: ColumnKey,
  toIndex: number,
): SidebarColumns {
  const fromColumn = columnOf(columns, key);
  if (!fromColumn) return columns;
  const source = columns[fromColumn].filter((k) => k !== key);
  const target = fromColumn === toColumn ? source : [...columns[toColumn]];
  const index = Math.max(0, Math.min(toIndex, target.length));
  target.splice(index, 0, key);
  return fromColumn === toColumn
    ? { ...columns, [toColumn]: target }
    : { ...columns, [fromColumn]: source, [toColumn]: target };
}
