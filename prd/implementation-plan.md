# Implementation Plan

A stepped, dependency-ordered plan to build the Resume Manager MVP. Each step is a shippable slice — earlier steps unblock later ones. Grounded in [tech-stack.md](./tech-stack.md), [architecture.md](./architecture.md), and [frontend-design.md](./frontend-design.md).

---

## Step 1 — Project scaffold & tooling

- Scaffold Next.js (App Router) + TypeScript with `pnpm`; add ESLint + Prettier and strict `tsconfig`.
- Add core dependencies: `antd`, `@ant-design/nextjs-registry`, `zod`, `react-hook-form`, `@hookform/resolvers`, `@react-pdf/renderer`, `prisma`, `@prisma/client`.
- Set up the target folders (`app/`, `components/`, `components/pdf/`, `lib/schemas/`, `lib/db.ts`, `prisma/`) and commit a first green `next build`.

## Step 2 — Database & data layer

- Add `prisma/schema.prisma` with the document-oriented `Resume` model (`content` as `Json` JSONB, `status` enum `DRAFT | PUBLISHED`, `@@index([userId, status])`).
- Create the Prisma client singleton (`lib/db.ts`) safe for serverless/hot-reload.
- Run `prisma migrate dev`; provide `.env.example` with `DATABASE_URL` and a Docker Postgres snippet for local dev.

## Step 3 — Shared validation schema (single source of truth)

- Define the Zod schema for the full resume `content` (summary, experience[], education[], skills[]) in `lib/schemas/`.
- Export the inferred TypeScript type; this type is the contract for the form, the Server Action, and the JSONB payload.
- Add unit tests (Vitest) covering valid/invalid payloads and defaults.

## Step 4 — antd theme & app shell

- Wrap the root layout in `AntdRegistry` + `ConfigProvider` using the light/dark `ThemeConfig` from `frontend-design.md` (§10).
- Load Fraunces / Inter / IBM Plex Mono via `next/font`; expose `--brass` and `--paper` CSS variables (theme-independent).
- Build the top bar (editable title, save-state slot, Export button, theme toggle) and the responsive split-screen shell (`lg`+ two-pane, `< md` Edit/Preview `Segmented`).

## Step 5 — Resume editor

- Build the section-based editor with React Hook Form + `zodResolver`, antd inputs wired via `Controller`; repeatable entries via `Form.List`.
- Implement sections as collapsible antd `Card`s (Summary, Experience, Education, Skills) with Fraunces titles and mono meta lines.
- Handle the empty-state / dashboard ("Two readers. One resume.") and "New resume" creation.

## Step 6 — Auto-save (Server Action)

- Implement the `saveDraft(resumeId, content)` Server Action: Zod-validate, then overwrite `Resume.content` for the active DRAFT.
- Wire a debounced trigger (3–5s / on blur) from the form; surface the `Saved · hh:mm` mono state with the single brass pulse.
- Add optimistic UI + failure handling (retry, "your work is saved" reassurance copy).

## Step 7 — PDF document component (ATS-safe)

- Build one shared `@react-pdf/renderer` document component in `components/pdf/`, driven by the Zod-typed content.
- Enforce ATS rules: embedded Roboto font, single-column linear reading order, plain-text section headings (no icon-only labels).
- Verify the emitted PDF has a selectable, parseable text layer.

## Step 8 — Live preview & ATS Lens

- Render the shared PDF component client-side next to the editor, updating in real time from form state.
- Build the **ATS Lens** signature panel (mono readout: text layer / reading order / detected sections / font), driven off the current content.
- Collapse the Lens to a single status chip on mobile; expose statuses via `aria-live` for a11y.

## Step 9 — Export endpoint

- Implement `GET /api/export/:id` Route Handler on the Node runtime: Prisma fetch → render the shared PDF component → stream the `.pdf` back as an attachment.
- Add an authorization guard on `:id` (no IDOR) and validate content before rendering.
- Wire the Export button → toast `Exported <name>.pdf`; handle the build-error path with the reassuring copy.

## Step 10 — Responsiveness, accessibility & motion polish

- Verify all breakpoints (`xs`–`lg`), the fixed mobile export bar (safe-area inset), and sticky desktop preview.
- Enforce the a11y floor: visible focus rings, keyboard path through the editor, AA contrast (brass restricted to large/icon/border), `prefers-reduced-motion` on every transition.
- Confirm dark mode dims the workbench but the preview paper stays light.

## Step 11 — CI/CD & deployment

- Add GitHub Actions: install → lint + `tsc --noEmit` → Vitest → `next build`; deploy Preview per PR.
- On `main`: run `prisma migrate deploy` → deploy to the chosen host (Vercel first-party, or Docker to Fly.io/Railway), with a managed serverless Postgres + connection pooler.
- Add a post-deploy smoke test hitting `/api/export`; wire Sentry for errors.

---

### Quality gates per step (per [skills.md](./skills.md))

- Before each commit of product code: `/verify` and `/run` on the affected flow.
- Before each PR: `/code-review`, then `/simplify`.
- Before first production deploy: `/security-review` (focus: `/api/export` IDOR, JSONB input) and `/code-review ultra`.
