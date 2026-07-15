import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";

import { FoucGate } from "@/components/app-shell/fouc-gate";
import { ThemeProvider, THEME_NO_FLASH_SCRIPT } from "@/components/theme/theme-provider";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resume Manager",
  description: "Write for a person. Export for a parser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }} />
      </head>
      <body>
        {/* Masks antd's CSS-in-JS flash of unstyled content until hydration;
            see components/app-shell/fouc-gate.tsx. Sits outside AntdRegistry
            so it never depends on antd styles itself. */}
        <FoucGate />
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
