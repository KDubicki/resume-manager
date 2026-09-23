"use client";

import { useSyncExternalStore } from "react";

import styles from "./save-indicator.module.css";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const noopSubscribe = () => () => {};

// False during SSR and hydration, true after. The time is formatted in the
// viewer's locale + timezone, which the server (a UTC container) can't know,
// so rendering it on the server would mismatch and throw away the tree.
function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function SaveIndicator({
  status,
  lastSavedAt,
  error,
  onRetry,
}: {
  status: SaveStatus;
  lastSavedAt: Date | null;
  error?: string | null;
  onRetry?: () => void;
}) {
  const mounted = useHasMounted();

  return (
    <span className={`font-mono ${styles.indicator}`} aria-live="polite">
      {status === "saving" && "Saving…"}
      {status === "saved" && lastSavedAt && (
        <>
          {/* Remount the dot on every save so its one-shot animation replays;
              prefers-reduced-motion (globals.css) collapses it to instant. */}
          <span key={lastSavedAt.getTime()} className={styles.brassDot} aria-hidden="true" />
          {mounted ? `Saved · ${formatTime(lastSavedAt)}` : "Saved"}
        </>
      )}
      {status === "error" && (
        <span className={styles.error}>
          {`Couldn't save · ${error ?? "your work isn't lost"} —`}{" "}
          <button type="button" className={styles.retry} onClick={onRetry}>
            try again
          </button>
        </span>
      )}
      {status === "idle" && "Not saved yet"}
    </span>
  );
}
