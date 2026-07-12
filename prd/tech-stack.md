# Technology Stack & Alternatives

This document records the technology decisions for the Resume Manager MVP, the **rationale** behind each choice, and the **alternatives** that were evaluated. The guiding constraint is a **serverless monolith** optimized for time-to-market and ATS-safe PDF output.

Legend: ✅ = selected for MVP · 🔄 = viable alternative · ⚠️ = trade-off to watch.

---

## 1. Core Framework

### ✅ Next.js (App Router) + TypeScript

One project serves both the client UI and the business logic (Server Actions, Route Handlers), eliminating a separate backend service. Server Actions give us first-class RPC-style mutations for the auto-save flow, and Route Handlers give us a streaming endpoint for PDF export.

**Why this fits the MVP**

- Single deployable unit → simplest possible deployment topology.
- Server Actions cover the auto-save mutation without hand-rolled API plumbing.
- Mature serverless story on multiple hosts.
- TypeScript end-to-end, sharing types between UI, validation, and DB.

**Alternatives considered**

| Option | Notes | Verdict |
|--------|-------|---------|
| **Remix / React Router 7** | 🔄 Excellent progressive-enhancement forms, great fit for the editor. Smaller PDF/serverless ecosystem than Next.js. | Strong second choice. |
| **SvelteKit** | 🔄 Smaller bundles, fast DX. But `@react-pdf/renderer` is React-only, so it would force a different PDF path. | Rejected — conflicts with PDF stack. |
| **Separate SPA + Node/Nest API** | ⚠️ Two deployables, two pipelines. Contradicts the monolith priority. | Rejected for MVP. |

---

## 2. User Interface

### ✅ Ant Design (antd)

A comprehensive, enterprise-grade React component library with a rich, batteries-included set of components — `Form`, `Input`, `Select`, `DatePicker`, `Table`, `Layout`, `Steps`, `Upload`, and more — that map directly onto a data-dense resume editor. Ant Design ships a mature, consistent design language out of the box, so the team spends time on product logic rather than building primitives.

**Why this fits the MVP**

- **Complete component set** — the editor's multi-section forms, list editors (Experience/Education), steppers, and modals exist as first-class components.
- **First-class forms** — antd's `Form` integrates cleanly with **React Hook Form + Zod** (see §3) via the `Controller` pattern, or can be validated directly.
- **Fast time-to-market** — a polished, consistent look with zero design system to build from scratch.
- **Theming** — antd v5 uses CSS-in-JS design tokens (`ConfigProvider`), enabling a custom brand theme without ejecting.
- **SSR support** — works with the Next.js App Router via `@ant-design/nextjs-registry` for flicker-free server rendering.

**⚠️ Trade-offs to watch**

- Larger runtime footprint than utility-CSS approaches — import components granularly and rely on tree-shaking.
- Opinionated visual language; heavy rebranding takes theme-token work.
- App Router requires the antd registry setup to avoid style flashes during SSR.

**Alternatives considered**

| Option | Notes | Verdict |
|--------|-------|---------|
| **MUI (Material UI)** | 🔄 Comparably complete and mature. Material look is more opinionated for a business/resume tool. | Closest alternative. |
| **Mantine** | 🔄 Rich component set, excellent DX and hooks. Smaller ecosystem than antd. | Viable alternative. |
| **Tailwind CSS + shadcn/ui** | 🔄 Copy-in, fully-owned components; maximum design control but more primitives to assemble by hand. | Rejected — slower to a polished, data-dense editor. |
| **Chakra UI** | 🔄 Great DX, but runtime CSS-in-JS overhead and a thinner component set for data-heavy forms. | Rejected. |

---

## 3. Forms & Validation

### ✅ React Hook Form + Zod

RHF gives performant, uncontrolled-by-default forms (fewer re-renders — important with a live preview attached). Zod provides one schema that validates on the **client** and the **server**, and also describes the shape of the JSONB `content` column.

**Why this fits the MVP**

- Minimal re-renders keep the live preview smooth.
- **One schema, three jobs**: client validation, server validation, DB payload shape.
- `zodResolver` wires the two libraries together with near-zero glue.

**Alternatives considered**

| Option | Notes | Verdict |
|--------|-------|---------|
| **Formik + Yup** | 🔄 Mature, but more re-renders and Yup's types are weaker than Zod's inference. | Rejected. |
| **TanStack Form** | 🔄 Promising, framework-agnostic, strong types. Younger ecosystem than RHF. | Watch for v2. |
| **Valibot** (instead of Zod) | 🔄 Smaller bundle, similar API. Zod chosen for ecosystem maturity and `@hookform/resolvers` support. | Viable alternative. |

---

## 4. PDF Generation

### ✅ @react-pdf/renderer

Compiles React components directly into PDF drawing instructions, producing a **native text layer** (not a screenshot). The same document component renders **client-side** for the live preview and **server-side** for the export stream — one codebase for both paths. This is the linchpin of the ATS strategy.

**Why this fits the MVP**

- Emits real, selectable, parseable text → ATS-safe by construction.
- Embeds standard fonts (e.g., Roboto) for consistent rendering.
- Shared component for preview and export.
- No headless browser to run in the serverless function.

**⚠️ Trade-offs to watch**

- Layout engine is a subset of CSS (flexbox-ish); complex designs need care.
- Server-side rendering of large documents is CPU/memory-bound — size the serverless function accordingly (see architecture doc).

**Alternatives considered**

| Option | Notes | Verdict |
|--------|-------|---------|
| **Puppeteer / Playwright → print-to-PDF** | 🔄 Full CSS fidelity from real HTML. But ships a headless Chromium (heavy cold starts, large bundle) and needs care to keep text selectable. | Rejected — weight & serverless friction. |
| **pdf-lib** | 🔄 Low-level PDF construction, great for stamping/merging. Too manual for a layout-driven resume. | Rejected — wrong abstraction. |
| **PDFKit** | 🔄 Imperative drawing API. More boilerplate; no React component reuse. | Rejected. |
| **Typst / LaTeX service** | 🔄 Beautiful typographic output. Adds a non-JS toolchain and a separate service — breaks the monolith. | Rejected for MVP; revisit for premium templates. |

---

## 5. Database

### ✅ PostgreSQL

A reliable relational database with **first-class JSONB** support — ideal for the document-oriented resume payload while keeping the door open to normalize later. Rich indexing (incl. GIN on JSONB) and a strong managed-hosting market.

**Why this fits the MVP**

- JSONB stores the whole resume `content` in one column → cheap drafting/versioning.
- Can add relational tables later without a migration off the engine.
- Excellent managed, serverless-friendly hosting options.

**Alternatives considered**

| Option | Notes | Verdict |
|--------|-------|---------|
| **MongoDB** | 🔄 Natural document store. But we want the option to normalize and get relational guarantees later; Postgres+JSONB gives both. | Rejected — Postgres covers the document case too. |
| **MySQL / PlanetScale** | 🔄 Solid, great scaling story. Weaker JSON ergonomics than Postgres JSONB. | Viable alternative. |
| **SQLite / Turso** | 🔄 Ultra-simple, cheap. Concurrency/scaling limits for a multi-user web app. | Good for prototypes only. |

---

## 6. ORM

### ✅ Prisma

Type-safe database client with a declarative schema and a first-class migration workflow (`prisma migrate`). Generated types flow straight into the TypeScript app, and JSONB columns are typed as `Json`.

**Why this fits the MVP**

- Type-safe queries reduce whole classes of runtime bugs.
- `prisma migrate deploy` is a clean CI/CD step.
- Great DX (`prisma studio`, autocompletion).

**⚠️ Trade-offs to watch**

- In some serverless runtimes the engine benefits from a connection pooler (e.g., Prisma Accelerate, PgBouncer, or a driver adapter). Plan pooling for production.

**Alternatives considered**

| Option | Notes | Verdict |
|--------|-------|---------|
| **Drizzle ORM** | 🔄 Lightweight, SQL-first, excellent serverless/edge story and tiny footprint. Strong modern alternative. | Close runner-up. |
| **Kysely** | 🔄 Type-safe query builder, no heavy runtime. More manual than Prisma's schema-first model. | Viable alternative. |
| **TypeORM / Sequelize** | ⚠️ Mature but heavier and less type-safe than the above. | Rejected. |

---

## Stack Summary

| Layer | ✅ Selected | Closest Alternative |
|-------|------------|---------------------|
| Core framework | Next.js (App Router) + TS | Remix / React Router 7 |
| UI | Ant Design (antd) | MUI / Mantine |
| Forms & validation | React Hook Form + Zod | TanStack Form / Valibot |
| PDF | @react-pdf/renderer | Puppeteer print-to-PDF |
| Database | PostgreSQL (JSONB) | MySQL / PlanetScale |
| ORM | Prisma | Drizzle ORM |

---

## Supporting Tooling (recommended)

These are not in the core spec but are the sensible defaults a DevOps Architect would standardize on for the MVP.

| Concern | Recommendation | Alternative |
|---------|----------------|-------------|
| Package manager | pnpm | npm / yarn |
| Linting / formatting | ESLint + Prettier (or Biome) | Biome (all-in-one) |
| Testing (unit) | Vitest | Jest |
| Testing (e2e) | Playwright | Cypress |
| Auth (post-MVP) | Auth.js (NextAuth) | Clerk / Lucia |
| Error tracking | Sentry | Highlight / self-hosted |
| CI/CD | GitHub Actions | GitLab CI |
| Container (portable path) | Docker | — |
