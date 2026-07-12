"use client";

import styles from "./save-indicator.module.css";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function SaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
}) {
  return (
    <span className={`font-mono ${styles.indicator}`} aria-live="polite">
      {status === "saving" && "Saving…"}
      {status === "saved" && lastSavedAt && (
        <>
          {/* Remount the dot on every save so its one-shot animation replays;
              prefers-reduced-motion (globals.css) collapses it to instant. */}
          <span key={lastSavedAt.getTime()} className={styles.brassDot} aria-hidden="true" />
          {`Saved · ${formatTime(lastSavedAt)}`}
        </>
      )}
      {status === "error" && (
        <span className={styles.error}>
          Couldn&apos;t save · your work isn&apos;t lost —{" "}
          <button type="button" className={styles.retry} onClick={onRetry}>
            try again
          </button>
        </span>
      )}
      {status === "idle" && "Not saved yet"}
    </span>
  );
}
