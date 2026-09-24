import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const GLOBALS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

function filesEndingWith(dir: string, suffix: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return filesEndingWith(path, suffix);
    return entry.name.endsWith(suffix) ? [path] : [];
  });
}

const inSourceDirs = (suffix: string) =>
  filesEndingWith(join(ROOT, "app"), suffix).concat(
    filesEndingWith(join(ROOT, "components"), suffix),
  );

// Component-scoped properties set from TSX via the style prop, e.g.
// style={{ "--tpl-accent": accent }}; these are defined where they're used.
const inlineProps = new Set(
  inSourceDirs(".tsx").flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/["'](--[a-z0-9-]+)["']\s*:/g)].map((m) => m[1]!),
  ),
);

// Component-scoped properties a CSS module declares itself (e.g. `--stage:` in
// status-tag.module.css); these are defined where they're used.
const moduleProps = new Set(
  inSourceDirs(".module.css").flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]!),
  ),
);

// Custom properties declared inside the first `{ ... }` block that follows
// `selector` (theme blocks contain no nested braces).
function definedIn(selector: string): Set<string> {
  const start = GLOBALS.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = GLOBALS.indexOf("{", start);
  const block = GLOBALS.slice(open, GLOBALS.indexOf("}", open));
  return new Set([...block.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]!));
}

const light = definedIn(":root {");
const dark = definedIn(':root[data-theme="dark"]');
const systemDark = definedIn(':root:not([data-theme="light"])');

// A var() that is never defined silently takes its fallback (or `unset`),
// which is how dark mode once shipped light-mode greys and an off-palette blue.
describe("design tokens", () => {
  it("defines every custom property a CSS module uses", () => {
    const used = new Set(
      inSourceDirs(".module.css")
        .flatMap((file) =>
          [...readFileSync(file, "utf8").matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]!),
        )
        // --font-* come from next/font on <html>, not from globals.css.
        .filter(
          (name) => !name.startsWith("--font-") && !inlineProps.has(name) && !moduleProps.has(name),
        ),
    );
    expect([...used].filter((name) => !light.has(name))).toEqual([]);
  });

  it("gives both dark-theme blocks the same tokens as the light theme", () => {
    expect([...dark].sort()).toEqual([...light].sort());
    expect([...systemDark].sort()).toEqual([...light].sort());
  });
});
