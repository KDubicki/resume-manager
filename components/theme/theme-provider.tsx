"use client";

// antd v5 officially supports React 16-18; this patches it for React 19
// (our Next.js scaffold's default). No-op once antd ships native v19 support.
import "@ant-design/v5-patch-for-react-19";

import { App, ConfigProvider } from "antd";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { darkTheme, lightTheme } from "@/lib/theme/tokens";

export type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type ThemeState = { mode: ThemeMode; resolvedTheme: ResolvedTheme };

export const THEME_STORAGE_KEY = "resume-manager:theme";

type ThemeContextValue = ThemeState & {
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }
  return ctx;
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === "auto" ? getSystemTheme() : mode;
}

const SERVER_SNAPSHOT: ThemeState = { mode: "auto", resolvedTheme: "light" };
let cachedSnapshot: ThemeState = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function computeSnapshot(): ThemeState {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  const mode = stored ?? "auto";
  return { mode, resolvedTheme: resolve(mode) };
}

function getSnapshot(): ThemeState {
  const next = computeSnapshot();
  if (next.mode !== cachedSnapshot.mode || next.resolvedTheme !== cachedSnapshot.resolvedTheme) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): ThemeState {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    mediaQuery.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

function persistMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  notify();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, resolvedTheme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // The blocking inline script (see app/layout.tsx) already applied this
  // synchronously before paint; this keeps it correct across later changes.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const setMode = useCallback((next: ThemeMode) => persistMode(next), []);

  const value = useMemo(
    () => ({ mode, resolvedTheme, setMode }),
    [mode, resolvedTheme, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>
        {/* Lets components use App.useApp() for message/notification/modal
            that pick up the ConfigProvider theme, instead of the static
            antd singletons (which don't). */}
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export const THEME_NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var mode = stored || "auto";
    var resolved = mode === "auto"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.dataset.theme = resolved;
  } catch (e) {}
})();
`;
