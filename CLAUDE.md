# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

**This repository is at the specification/planning stage — there is no application code yet.** It contains only Markdown design documents. There is no `package.json`, no build, no tests, and no source tree. Commands below (build/lint/test) do not exist until the Next.js app is scaffolded.

When scaffolding begins, the target layout, stack, and conventions are already decided — follow the `prd/` documents rather than improvising.

## Documentation Map

| File | What it authoritatively defines |
|------|--------------------------------|
| `README.md` | Project overview, target repo structure, data model, ATS rules, deployment baseline. |
| `prd/tech-stack.md` | Chosen technologies + rationale + evaluated alternatives. |
| `prd/architecture.md` | Runtime architecture, user-flow sequence diagrams, deployment topology, ops checklist. |
| `prd/frontend-design.md` | UI design system: palette, light/dark mode, typography, responsive layout, the ATS Lens. |
| `prd/implementation-plan.md` | Dependency-ordered, stepped build plan for the MVP. |
| `prd/skills.md` | Which Claude Code skills to use at each stage of the delivery lifecycle. |

All docs are in English. Keep new docs in English unless told otherwise.

## Architecture (target)

The design is a **serverless monolith**: a single Next.js (App Router) + TypeScript application that contains the UI, the mutation logic (Server Actions), the PDF export endpoint (Route Handler), and the data layer (Prisma). There is intentionally **no separate backend service**. Optimize for time-to-market, but keep the seams (Zod schemas, PDF component, data layer) clean so the monolith stays decomposable.

Three architectural decisions drive most of the code and must not be silently violated:

1. **Document-oriented data model.** The entire resume payload is stored in a single JSONB `content` column on the `Resume` model — *not* normalized into `experience`/`education`/etc. tables. This keeps drafting and versioning cheap. Don't normalize the resume body without an explicit decision to do so.

2. **One Zod schema, three jobs.** The same Zod schema validates on the **client**, validates on the **server** (Server Action), and defines the shape of the JSONB `content`. Client and server validation must share the schema so the stored blob never drifts.

3. **One PDF component, two render paths.** A single `@react-pdf/renderer` document component is rendered **client-side** for the live preview and **server-side** for the export stream. "What you preview" must equal "what you export" — never fork these into two layouts.

### The three core flows

- **Auto-save:** debounced (3–5 s, or on blur) React Hook Form → Server Action → Zod validate → overwrite `Resume.content` for the active DRAFT.
- **Live preview:** client-side `@react-pdf/renderer` renders current form state in real time, next to the editor.
- **Export:** `GET /api/export/:id` → Prisma fetch → map to PDF component → stream `.pdf` back.

## ATS Constraints (hard requirements, not styling preferences)

The generated PDF must be machine-parseable by Applicant Tracking Systems. Any resume template must satisfy all three:

1. **Text, not images** — render with embedded standard fonts (e.g., Roboto); never rasterize text.
2. **Linear reading order** — top-to-bottom; avoid multi-column layouts for key sections (Experience) so parsers don't interleave headings with descriptions.
3. **Semantic clarity** — section names (Experience, Education, Skills) written as plain text, never replaced by iconography alone.

Treat these as constraints on the PDF component. A visually appealing layout that breaks ATS parsing is a regression.

## Stack (decided — see prd/tech-stack.md for rationale/alternatives)

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Ant Design (antd v5) — needs `@ant-design/nextjs-registry` `AntdRegistry` in the root layout to avoid SSR style flicker with the App Router
- **Forms/validation:** React Hook Form + Zod (antd inputs wired via `Controller`)
- **PDF:** `@react-pdf/renderer`
- **DB / ORM:** PostgreSQL (JSONB) / Prisma
- **Package manager:** pnpm

## Operational Notes for Implementation

- **Server-side PDF rendering is CPU/memory-bound.** The `/api/export` Route Handler should run on a Node (not edge) runtime with extra memory/timeout. A key reason `@react-pdf/renderer` was chosen over Puppeteer is to avoid bundling a headless browser into the serverless function.
- **Prisma + serverless needs connection pooling** (Prisma Accelerate, PgBouncer, or a driver adapter) to avoid connection exhaustion in production.
- **Migrations run in CI** via `prisma migrate deploy` — never manually against production.

## Highest-Risk Surfaces

When reviewing or changing code, these two paths warrant extra scrutiny (and a `/security-review` before release):

- **`/api/export/:id`** — streams a file by id; guard against IDOR / unauthorized access.
- **JSONB `content` persistence** — user-supplied payload; always validate through the shared Zod schema before writing.
