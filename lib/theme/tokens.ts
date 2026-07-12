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
    colorPrimary: "#39A99E",
    colorBgLayout: "#0D1413",
    colorBgContainer: "#151D1B",
    colorBgElevated: "#1E2826",
    colorText: "#E7ECEA",
    colorTextSecondary: "#9DABA6",
    colorBorder: "#2A3532",
    colorSuccess: "#4FB07F",
    colorWarning: "#D6A24C",
    colorError: "#D3707A",
  },
};
