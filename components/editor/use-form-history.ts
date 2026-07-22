"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ResumeContent } from "@/lib/schemas/resume";

// Edits within this window collapse into a single history step, so undo reverses
// a logical change (a typed phrase, a reorder) rather than one keystroke.
const DEBOUNCE_MS = 500;

export interface FormHistory {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function snapshot(values: ResumeContent): ResumeContent {
  // Deep clone so a stored snapshot can't be mutated by later form edits (RHF
  // hands back live references). Values are plain JSON, so this is sufficient.
  return structuredClone(values);
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

// Undo/redo for the whole resume form (UX-3). Records debounced snapshots of the
// form values and restores them with reset(); `onApply` lets the editor push the
// restored state to the preview and autosave.
export function useFormHistory(
  methods: UseFormReturn<ResumeContent>,
  onApply?: (values: ResumeContent) => void,
): FormHistory {
  const { watch, getValues, reset } = methods;

  const past = useRef<ResumeContent[]>([]);
  const future = useRef<ResumeContent[]>([]);
  const present = useRef<ResumeContent>(snapshot(getValues()));
  // Set while a reset() from undo/redo is in flight so the resulting change
  // isn't recorded as a fresh history step.
  const applying = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  const record = useCallback(() => {
    const current = snapshot(getValues());
    if (JSON.stringify(current) === JSON.stringify(present.current)) return;
    past.current.push(present.current);
    present.current = current;
    future.current = []; // a fresh edit invalidates the redo stack
    syncFlags();
  }, [getValues, syncFlags]);

  // Fold any pending (still-debounced) edit into history right now.
  const commitPending = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    record();
  }, [record]);

  useEffect(() => {
    const subscription = watch(() => {
      if (applying.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        record();
      }, DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [watch, record]);

  const apply = useCallback(
    (values: ResumeContent) => {
      applying.current = true;
      reset(values);
      onApply?.(values);
      // Re-enable recording after the reset-driven watch notifications settle.
      setTimeout(() => {
        applying.current = false;
      }, 0);
    },
    [reset, onApply],
  );

  const undo = useCallback(() => {
    commitPending();
    const prev = past.current.pop();
    if (prev === undefined) return;
    future.current.push(present.current);
    present.current = prev;
    syncFlags();
    apply(prev);
  }, [commitPending, apply, syncFlags]);

  const redo = useCallback(() => {
    commitPending();
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(present.current);
    present.current = next;
    syncFlags();
    apply(next);
  }, [commitPending, apply, syncFlags]);

  // Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z (or Ctrl+Y). Deliberately defers to the
  // browser's native per-field text undo while a text input is focused, so
  // typing corrections aren't hijacked; the toolbar buttons cover that case.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      const isUndo = key === "z" && !event.shiftKey;
      const isRedo = (key === "z" && event.shiftKey) || key === "y";
      if (!isUndo && !isRedo) return;
      if (isEditableTarget(document.activeElement)) return;
      event.preventDefault();
      if (isUndo) undo();
      else redo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo };
}
