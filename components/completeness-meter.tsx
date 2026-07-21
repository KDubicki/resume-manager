import type { CompletenessItem } from "@/lib/ats/completeness";

import styles from "./completeness-meter.module.css";

// Shared color banding with the ATS readiness meter (ATS-3): green when nearly
// done, amber mid-way, red when barely started.
function bandFor(percent: number): "good" | "fair" | "weak" {
  return percent >= 80 ? "good" : percent >= 50 ? "fair" : "weak";
}

// Full meter (editor): header, bar, and a per-field checklist so the user can
// see exactly what's still missing.
export function CompletenessMeter({
  percent,
  items,
}: {
  percent: number;
  items: CompletenessItem[];
}) {
  return (
    <div className={`font-mono ${styles.meter}`}>
      <div className={styles.head}>
        <span className={styles.headLabel}>COMPLETENESS</span>
        <span className={styles.headValue}>{percent}%</span>
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Resume completeness"
      >
        <div
          className={styles.fill}
          data-band={bandFor(percent)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className={styles.items}>
        {items.map((item) => (
          <span key={item.key} className={styles.item}>
            <span className={item.done ? styles.itemDone : styles.itemTodo} aria-hidden="true">
              {item.done ? "✓" : "·"}
            </span>
            <span className={item.done ? undefined : styles.itemLabelTodo}>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Compact bar (dashboard card): a caption and the bar only, no card chrome —
// the card supplies its own.
export function CompletenessBar({ percent }: { percent: number }) {
  return (
    <div className={`font-mono ${styles.compact}`}>
      <div className={styles.compactCaption}>{percent}% complete</div>
      <div
        className={styles.track}
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Resume completeness"
      >
        <div
          className={styles.fill}
          data-band={bandFor(percent)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
