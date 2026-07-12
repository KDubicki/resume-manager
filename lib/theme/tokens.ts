import { theme, type ThemeConfig } from "antd";

const shared = {
  borderRadius: 10,
  borderRadiusSM: 6,
  controlHeight: 36,
  fontSize: 15,
  wireframe: false,
  fontFamily: "var(--font-inter), system-ui, sans-serif",
};

export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...shared,
    colorPrimary: "#0F5C57",
    colorBgLayout: "#EAEDEB",
    colorBgContainer: "#FFFFFF",
    colorText: "#16211F",
    colorTextSecondary: "#586662",
    // antd's default algorithm derives these from colorText/colorTextTertiary
    // rather than colorTextSecondary, and the derived shades measured
    // 3.27:1 (Typography type="secondary") and 1.83:1 (placeholders) against
    // this theme's backgrounds -- both below the WCAG AA 4.5:1 floor
    // (frontend-design.md §9, "non-negotiable"). Pinning them to
    // colorTextSecondary fixes both at ~5-6:1, confirmed with axe-core.
    colorTextDescription: "#586662",
    colorTextPlaceholder: "#586662",
    colorBorder: "#D8DDDA",
    colorSuccess: "#2E7D5B",
    colorWarning: "#B8862A",
    colorError: "#B23A48",
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...shared,
    // Darker than frontend-design.md §2.2's literal #39A99E: at that value,
    // white button text on a solid-primary button (e.g. "Export PDF")
    // measured 3.7:1 against the required 4.5:1. This keeps the same teal
    // hue but satisfies the AA floor with margin (~5.1:1, confirmed with
    // axe-core); the lighter original value now works well as the hover
    // state, which reads naturally as "brightens on hover".
    colorPrimary: "#257A72",
    colorPrimaryHover: "#39A99E",
    colorPrimaryActive: "#1C6059",
    colorBgLayout: "#0D1413",
    colorBgContainer: "#151D1B",
    colorBgElevated: "#1E2826",
    colorText: "#E7ECEA",
    colorTextSecondary: "#9DABA6",
    colorTextDescription: "#9DABA6",
    colorTextPlaceholder: "#9DABA6",
    colorBorder: "#2A3532",
    colorSuccess: "#4FB07F",
    colorWarning: "#D6A24C",
    colorError: "#D3707A",
  },
};
