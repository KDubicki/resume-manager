"use client";

import { useState } from "react";

import { previewJsonResume, type ImportPreview } from "@/lib/import/json-resume";

export interface LoadedJsonResume {
  fileName: string;
  // The parsed-but-unmapped JSON, sent as-is to the server action (which
  // re-maps and re-validates — the client mapping is only for the preview).
  raw: unknown;
  preview: ImportPreview;
}

// Reads a user-selected .json file, parses it, and builds a mapped preview.
// Shared by the dashboard import modal and the editor import card so both read
// files and surface errors identically.
export function useJsonResumeFile() {
  const [loaded, setLoaded] = useState<LoadedJsonResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readFile = async (file: File) => {
    setError(null);
    setLoaded(null);
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      setError("That file isn't valid JSON.");
      return;
    }
    const preview = previewJsonResume(raw);
    if (!preview) {
      setError("This file couldn't be read as a resume.");
      return;
    }
    setLoaded({ fileName: file.name, raw, preview });
  };

  const reset = () => {
    setLoaded(null);
    setError(null);
  };

  return { loaded, error, readFile, reset };
}
