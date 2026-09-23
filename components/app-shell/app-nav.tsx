"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import styles from "./app-nav.module.css";

// The editor is a resume page, so it keeps "Resumes" lit.
function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/resume/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Global shell (DS-4): one nav on every route, replacing the per-page "← Back"
// links, and the only home of the theme toggle. Counts are fetched by the root
// layout, so a router.refresh() after any mutation keeps them current.
export function AppNav({
  openApplications,
  trashedCount,
}: {
  openApplications: number;
  trashedCount: number;
}) {
  const pathname = usePathname() ?? "/";

  const links = [
    { href: "/", label: "Resumes", count: 0 },
    { href: "/applications", label: "Applications", count: openApplications },
    { href: "/trash", label: "Trash", count: trashedCount },
  ];

  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          ◱
        </span>
        <span className={`font-display ${styles.wordmark}`}>Resume Manager</span>
      </Link>
      <nav className={styles.links} aria-label="Main">
        {links.map(({ href, label, count }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={styles.link}
              aria-current={active ? "page" : undefined}
            >
              {label}
              {count > 0 ? <span className={`font-mono ${styles.count}`}>{count}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className={styles.theme}>
        <ThemeToggle />
      </div>
    </header>
  );
}
