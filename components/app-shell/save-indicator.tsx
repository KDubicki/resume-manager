function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function SaveIndicator({ lastSavedAt }: { lastSavedAt: Date | null }) {
  return (
    <span className="font-mono" aria-live="polite" style={{ fontSize: 12.5, letterSpacing: "0.02em" }}>
      {lastSavedAt ? `Saved · ${formatTime(lastSavedAt)}` : "Not saved yet"}
    </span>
  );
}
