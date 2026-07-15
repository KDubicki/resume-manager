"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./fouc-gate.module.css";

// Masks antd's first-paint flash of unstyled content with a content-shaped
// skeleton (not a bare spinner), so loading reads as the real page taking shape.
//
// antd v5 is CSS-in-JS and injects its styles client-side during hydration.
// SSR extraction (@ant-design/nextjs-registry / static-style-extract) produces
// nothing under React 19 here, so the server HTML paints antd components before
// their styles exist. This overlay — styled entirely by render-blocking global
// CSS, so it's correct on the very first paint — covers the page until React
// has hydrated (exactly when antd's styles have been injected), then fades out.
// It only appears on a full load/refresh, not on client navigation.
function GridSkeleton() {
  return (
    <div className={styles.shell} aria-hidden="true">
      <div className={styles.topbar}>
        <div className={styles.titleCol}>
          <span className={`${styles.block} ${styles.titleLine}`} />
          <span className={`${styles.block} ${styles.subLine}`} />
        </div>
        <span className={`${styles.block} ${styles.button}`} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <span className={`${styles.block} ${styles.badge}`} />
            <span className={`${styles.block} ${styles.cardTitle}`} />
            <span className={`${styles.block} ${styles.cardMeta}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className={styles.editorWrap} aria-hidden="true">
      <div className={styles.editorTopbar}>
        <span className={`${styles.block} ${styles.titleLine}`} />
        <span className={`${styles.block} ${styles.button}`} />
      </div>
      <div className={styles.editorBody}>
        <div className={styles.editorCol}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className={`${styles.block} ${styles.sectionCard}`} />
          ))}
        </div>
        <div className={styles.previewCol}>
          <span className={`${styles.block} ${styles.preview}`} />
        </div>
      </div>
    </div>
  );
}

export function FoucGate() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Runs only after hydration, i.e. after antd injected its styles. Two
    // frames of headroom guard against a paint before the <style> applies.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setHidden(true)));
    // Safety net: never trap the user behind the skeleton if something stalls.
    const safety = setTimeout(() => setHidden(true), 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, []);

  if (removed) return null;

  const isEditor = pathname?.startsWith("/resume/") ?? false;

  return (
    <div
      className={`${styles.overlay}${hidden ? ` ${styles.hidden}` : ""}`}
      onTransitionEnd={() => setRemoved(true)}
      role="status"
      aria-live="polite"
    >
      {isEditor ? <EditorSkeleton /> : <GridSkeleton />}
      <span className={styles.srOnly}>Loading…</span>
    </div>
  );
}
