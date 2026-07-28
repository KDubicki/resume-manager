"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ApplicationView = "list" | "board";

const STORAGE_KEY = "resume-manager:applications-view";

// localStorage is an external store, so it's read through
// useSyncExternalStore rather than an effect: the server snapshot is always
// "list", the client's first snapshot comes from storage, and React reconciles
// the two without a hydration mismatch.
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // `storage` only fires for *other* tabs; the local set below notifies this one.
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): ApplicationView {
  return window.localStorage.getItem(STORAGE_KEY) === "board" ? "board" : "list";
}

/** Remembers list-vs-board across visits, shared between open tabs. */
export function useStoredView(): [ApplicationView, (view: ApplicationView) => void] {
  const view = useSyncExternalStore(subscribe, getSnapshot, () => "list" as const);

  const setView = useCallback((next: ApplicationView) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    for (const listener of listeners) listener();
  }, []);

  return [view, setView];
}
