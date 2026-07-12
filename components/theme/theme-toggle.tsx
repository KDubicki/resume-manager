"use client";

import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Segmented } from "antd";

import { useThemeMode, type ThemeMode } from "./theme-provider";

const OPTIONS: { label: React.ReactNode; value: ThemeMode; title: string }[] = [
  { label: <DesktopOutlined />, value: "auto", title: "Match system" },
  { label: <SunOutlined />, value: "light", title: "Light" },
  { label: <MoonOutlined />, value: "dark", title: "Dark" },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <Segmented
      aria-label="Theme"
      value={mode}
      onChange={(value) => setMode(value as ThemeMode)}
      options={OPTIONS.map(({ label, value, title }) => ({ label, value, title }))}
    />
  );
}
