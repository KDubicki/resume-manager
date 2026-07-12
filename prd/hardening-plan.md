# Hardening Plan

A stepped, dependency-ordered plan to fix the correctness and cleanup issues found by the `/code-review ultra` pass run after [implementation-plan.md](./implementation-plan.md)'s Step 11. Each step is a shippable slice — earlier steps unblock or de-risk later ones. Findings are grouped by the surface they touch, ordered by severity within each group.

---

## Step 1 — Save-flow reliability

The autosave/export pipeline (`components/editor/resume-editor.tsx`, `lib/actions/resume.ts`, `app/(editor)/page.tsx`) has several bugs that can silently lose or ship stale data — fix these first since later steps build on top of a trustworthy save flow.

- Filter blank lines out of the "highlights" textarea's value (`experience-section.tsx`) before calling `field.onChange`, so a trailing/blank line can no longer fail the schema's `min(1)` and block the *entire* draft's autosave.
- Wrap `saveDraft`'s `prisma.resume.updateMany` call and `flush()`'s `await saveDraft(...)` call in `try/catch`, mapping any thrown error to the existing `"error"` save state instead of leaving the UI stuck on "Saving…" forever.
- Add a request-generation guard to `flush()` (e.g. an incrementing ref compared before applying `setSaveStatus`/`setLastSavedAt`) so an older, slower save can no longer overwrite a newer one's result — in the UI state or, more importantly, in the DB write itself.
- Surface `saveDraft`'s actual `error` string in `SaveIndicator` instead of discarding it in `flush()`, so validation failures and "draft not found" are distinguishable to the user (and in logs).
- In `handleExport`, check the outcome of the pre-export `flush()` (via `retry()`'s return value or the current `saveState`) before proceeding to `fetch(/api/export/:id)` — abort with a clear error instead of exporting a stale DB row while reporting success.

## Step 2 — PDF/export data correctness

Fixes to what actually gets rendered and exported, once Step 1 guarantees the underlying save is trustworthy.

- Persist resume title changes: wire `TopBar`'s `onTitleChange` through a debounced Server Action call (extend `saveDraft` or add a sibling action) so a renamed resume's exported PDF heading and filename match what the live preview and top bar show.
- Add a `current: boolean` field to `educationEntrySchema` (`lib/schemas/resume.ts`) with a matching "Current" checkbox in `EducationSection` (mirroring `ExperienceSection`'s pattern), and pass `entry.current` instead of the hardcoded `false` into `resume-document.tsx`'s `formatRange` call for education — so a blank end date can actually render "Present" as the field's own placeholder promises.
- Make `components/pdf/ats-lens.tsx`'s section-detection and `components/pdf/resume-document.tsx`'s render condition agree on whether a whitespace-only summary counts as content (use `.trim()` consistently in both places).
- Fix `components/pdf/register-fonts.ts`'s registration race: cache the in-flight registration *promise* itself (not a boolean flag) so concurrent callers await the same in-progress work instead of one returning early before fonts are actually registered; on rejection, clear the cached promise so a later call can retry instead of being permanently locked out.

## Step 3 — Mobile UI fix

- Hide `TopBar`'s "Export PDF" button at the same breakpoint where `MobileExportBar` takes over (≤767.98px in `top-bar.module.css`), so mobile users see exactly one Export action instead of two simultaneous buttons.

## Step 4 — Error handling & empty-state feedback

- Add `.catch` handling to `handleNewResume`'s `createResume(...).then(...)` in `app/(editor)/page.tsx`, surfacing a toast/error state instead of leaving the "New resume" button silently doing nothing on failure.

## Step 5 — Theme correctness (antd altitude fix)

- Replace the CSS-module color override on the "Remove" button (`components/editor/list-section.module.css`'s `.removeButton`) with a proper theme-level fix: add `components: { Button: { colorError: '<passing-hex>' } }` to both light/dark theme configs in `lib/theme/tokens.ts` (verified via antd's `extractStyle` to correctly override every `danger` Button variant — text/link/solid — without triggering the dark-algorithm re-derivation that broke the earlier `colorError`/`dangerColor` attempts). Restore the plain `danger` prop on the Remove buttons and delete the CSS-module workaround, so any future danger-styled button gets the fix for free.

## Step 6 — Cleanup & simplification

Lower-risk, no user-facing behavior change — safe to batch together.

- Simplify `components/theme/theme-provider.tsx`: replace the `useSyncExternalStore` + module-level cached-snapshot/listeners-Set machinery (built for multiple independent subscribers) with a plain `useState` + one `useEffect` wiring the same `matchMedia`/`storage` listeners, since `ThemeProvider` is mounted exactly once in the whole app.
- Export `entryId` from `lib/schemas/resume.ts` and import it in `experience-section.tsx`, `education-section.tsx`, and `skills-section.tsx` instead of each calling `crypto.randomUUID()` directly — one source of truth for the id-generation strategy.
- In `resume-editor.tsx`'s `flush()`, also clear `previewTimeoutRef` (not just `timeoutRef`) so an explicit flush (blur/retry) doesn't leave a redundant live-preview update timer armed.

---

### Quality gates per step (per [skills.md](./skills.md))

- Before each commit: `/verify` and `/run` on the affected flow (Step 1 especially warrants a real save/export drive-through, not just unit tests).
- Before each PR: `/code-review`, then `/simplify`.
- After Step 5 (theme change): re-run the `axe-core` contrast check from Step 10's a11y pass to confirm the Button fix still holds across both themes.
- After all steps: a fresh `/code-review ultra` pass to confirm no regressions and no new issues introduced by the fixes themselves.
