# Frontend Design System

> Visual and interaction specification for the Resume Manager UI. Every token below maps to **Ant Design v5** (`ConfigProvider` + `theme` algorithms), so this document is directly implementable — not a mood board.

---

## 1. Design Thesis — "Two Readers"

Every resume is read twice: once by a **person** who feels something, and once by an **ATS parser** that only sees characters and their order. The interface embodies both readers:

- A **warm serif** carries the things the user reads and owns — their name, their story, section titles.
- A **technical mono** carries the machine's view — parse status, field metadata, autosave state, character counts.
- A calm **petrol-ink** neutral holds the workbench together, so the one thing that stays loud is the document itself.

Three decisions that make this specific to *this* product, not a generic dashboard:

1. **The document is the hero.** The live PDF preview is a real, lit sheet of paper. All UI chrome recedes so the paper is the brightest, most saturated thing on screen.
2. **Paper doesn't have a dark mode.** In dark mode the *workbench* dims, but the preview sheet stays paper-white — because that is what prints. WYSIWYG is honored literally.
3. **The ATS Lens is always present.** A quiet mono readout shows how the machine sees the document (text layer, reading order, detected sections). It is the signature element — see §7.

---

## 2. Color

Petrol ink for trust and focus; **brass** as the single signature accent, spent only on moments of confidence ("Saved", "ATS-ready"). Semantic reds are muted to a brick — an anxious job seeker should never be shouted at.

### 2.1 Light theme

| Role | Hex | antd token | Notes |
|------|-----|-----------|-------|
| Workbench (body bg) | `#EAEDEB` | `colorBgLayout` | Cool paper-gray, green undertone — deliberately **not** manila cream. |
| Panel / card surface | `#FFFFFF` | `colorBgContainer` | Editor cards. |
| Preview paper | `#FFFFFF` | — (custom) | The document sheet; carries the strongest shadow. |
| Primary — petrol ink | `#0F5C57` | `colorPrimary` | Buttons, active nav, focus. |
| Primary hover | `#12736C` | `colorPrimaryHover` | |
| Primary active | `#0B443F` | `colorPrimaryActive` | |
| Accent — brass | `#B07D2B` | — (custom `--brass`) | Signature only. Large text / icons / borders — **not** small body (≈3.6:1). |
| Text primary | `#16211F` | `colorText` | Near-black, green undertone. |
| Text secondary | `#586662` | `colorTextSecondary` | ~5.3:1 on white. |
| Text tertiary / placeholder | `#8A9591` | `colorTextTertiary` | |
| Border | `#D8DDDA` | `colorBorder` | |
| Border strong | `#C2C9C5` | `colorBorderSecondary` | |
| Success | `#2E7D5B` | `colorSuccess` | Petrol-tuned green. |
| Warning | `#B8862A` | `colorWarning` | Brass family. |
| Error | `#B23A48` | `colorError` | Muted brick, not pure red. |

### 2.2 Dark theme — "Night Shift"

Built on antd `theme.darkAlgorithm`, then overridden. The primary **brightens** for contrast; the preview paper **stays light**.

| Role | Hex | antd token | Notes |
|------|-----|-----------|-------|
| Workbench (body bg) | `#0D1413` | `colorBgLayout` | Deep petrol-black. |
| Panel / card surface | `#151D1B` | `colorBgContainer` | |
| Elevated (popovers, dropdowns) | `#1E2826` | `colorBgElevated` | |
| Preview paper | `#F7F7F4` | — (custom) | **Stays warm-white**, with a soft glow shadow so it reads as a lit sheet on a dark table. |
| Primary — teal | `#39A99E` | `colorPrimary` | Brightened for AA on dark. |
| Primary hover | `#4FBEB2` | `colorPrimaryHover` | |
| Primary active | `#2C877E` | `colorPrimaryActive` | |
| Accent — brass | `#D6A24C` | — (custom `--brass`) | |
| Text primary | `#E7ECEA` | `colorText` | |
| Text secondary | `#9DABA6` | `colorTextSecondary` | |
| Border | `#2A3532` | `colorBorder` | |
| Success / Warning / Error | `#4FB07F` / `#D6A24C` / `#D3707A` | — | Lightened counterparts. |

### 2.3 Theme mechanics

- Toggle stored in `localStorage`, applied before hydration to avoid a flash; default follows `prefers-color-scheme`.
- The toggle lives in the top bar as a `Segmented` (`Auto · Light · Dark`) or an icon `Button`.
- **The preview sheet ignores the theme** — it is always rendered against its own light paper token. This is intentional and must survive refactors.

---

## 3. Typography

The type pairing *is* the thesis. Load via `next/font` and self-host (no external CDN at runtime).

| Role | Typeface | Where |
|------|----------|-------|
| **Display** | **Fraunces** (opsz, soft-serif) | Resume owner's name, section titles, empty-state headlines, marketing. Warm, crafted — the *human* reader. |
| **Body / UI** | **Inter** | All antd components, form fields, buttons, body copy. The neutral connective tissue. |
| **Utility / data** | **IBM Plex Mono** | ATS Lens readout, autosave timestamps, character counts, field IDs. The *machine* reader. |

> Fraunces is a deliberate choice over the high-contrast Didone serif that AI resume tools default to — it has warmth and quirk without feeling like a wedding invitation. Plex Mono is not decoration: mono only ever appears where the machine's view is being surfaced, so its presence always *means* "this is what the parser sees."

### 3.1 antd wiring

antd uses one `fontFamily` token; set it to Inter and apply the other two via utility classes on specific elements.

```
token.fontFamily = "'Inter', system-ui, sans-serif"
.font-display  → "'Fraunces', Georgia, serif"
.font-mono     → "'IBM Plex Mono', ui-monospace, monospace"
```

### 3.2 Type scale (UI)

| Token | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| Display XL | 40 / 44 | Fraunces 500 | Empty-state / dashboard hero |
| Display L | 28 / 34 | Fraunces 500 | Resume name in top bar |
| Heading | 18 / 26 | Fraunces 500 | Section card titles |
| Body | 15 / 24 | Inter 400 | Default (`fontSize: 15`) |
| Label | 13 / 18 | Inter 500 | Field labels |
| Mono / data | 12.5 / 18 | Plex Mono 400, `letter-spacing: 0.02em` | ATS Lens, timestamps, counts |

---

## 4. Layout

Split-screen workbench: **you write on the left, the machine's output lives on the right.**

### 4.1 Desktop (≥ 992px, antd `lg`)

```
┌──────────────────────────────────────────────────────────────┐
│  ◱ Resume Manager   Senior Engineer CV ✎     Saved·12:03  [◐] │  top bar
│                                              [ Export PDF ]    │
├───────────────────────────────┬──────────────────────────────┤
│  EDITOR (scrolls)             │   PREVIEW (sticky)           │
│                               │  ┌────────────────────────┐  │
│  ▸ Summary            [card]  │  │                        │  │
│  ▸ Experience         [card]  │  │   ░ paper · the PDF ░  │  │
│     • Role @ Company          │  │                        │  │
│     • Role @ Company          │  │   (lit white sheet)    │  │
│     [+ Add experience]        │  │                        │  │
│  ▸ Education          [card]  │  └────────────────────────┘  │
│  ▸ Skills             [card]  │  ┌ ATS VIEW ──────────────┐  │
│                               │  │ ✓ Text layer detected  │  │
│                               │  │ ✓ Reading order: linear│  │
│                               │  │ ✓ Sections: 3 found    │  │
│                               │  └────────────────────────┘  │
└───────────────────────────────┴──────────────────────────────┘
        ~ 46% width                        ~ 54% width
```

- Left pane scrolls; right pane is `position: sticky`. The paper gets the most contrast on the page.
- Editor sections are antd `Card`s in a vertical stack; repeatable entries use `Form.List`.

### 4.2 Mobile (< 768px, antd `sm`/`xs`)

Panes can't sit side by side, so they become a mode toggle. Editing and previewing are distinct jobs on a phone.

```
┌───────────────────────────┐
│ ◱  Senior Engineer CV  [◐]│
├───────────────────────────┤
│   [  Edit  |  Preview  ]  │  ← antd Segmented, full-width
├───────────────────────────┤
│                           │
│   (active mode fills the  │
│    viewport)              │
│                           │
├───────────────────────────┤
│      [  Export PDF  ]     │  ← fixed bottom bar, safe-area inset
└───────────────────────────┘
```

- **Preview** mode shows the paper fit-to-width, with the ATS Lens collapsed into a single status chip that expands on tap.
- **Export** is a fixed bottom-bar primary button (respects `env(safe-area-inset-bottom)`).

### 4.3 Breakpoints (antd Grid)

| Range | Layout |
|-------|--------|
| `xs`–`sm` (< 768) | Single column, `Edit / Preview` toggle, fixed export bar. |
| `md` (768–991) | Two panes; preview narrower; ATS Lens below paper. |
| `lg`+ (≥ 992) | Full split-screen, sticky preview, ATS Lens as its own panel. |

---

## 5. Component Treatment (antd tokens)

Soft enough to feel friendly through long editing sessions; tight enough to read as a precision tool.

| Token | Value | Rationale |
|-------|-------|-----------|
| `borderRadius` | `10` | Cards — approachable, not bubbly. |
| `borderRadiusSM` | `6` | Inputs, buttons, tags. |
| `controlHeight` | `36` | Roomier inputs for a form-heavy editor. |
| `fontSize` | `15` | Comfortable body default. |
| `wireframe` | `false` | Filled, modern surfaces. |
| `boxShadow` (cards) | soft, low-spread | Chrome stays flat; the **paper** owns elevation. |

- **Buttons:** primary = petrol/teal fill; secondary = default; the **brass** fill is reserved for one place — the confirmed "ATS-ready" / export-success state, never a routine action.
- **Forms:** labels in Inter 500; validation via Zod → antd `Form.Item` `status`. Errors use muted brick, phrased as direction, not apology (see §8).
- **Cards (sections):** Fraunces title + a mono meta line (`3 entries · updated 12:03`). Collapsible to keep long resumes navigable.
- **Empty states:** Fraunces headline + one guiding line + a single primary action — never a bare "No data".

---

## 6. Motion

Restrained. Motion only marks the two things the user actually cares about: *it saved* and *the machine can read it*. Everything else uses antd defaults.

| Moment | Motion |
|--------|--------|
| Autosave commit | Mono `Saved · hh:mm` fades in; a single **brass dot** pulses once. No spinner during typing. |
| Add / remove entry | antd list motion (140ms ease); new card draws focus to its first field. |
| ATS-ready confirm | Brass check strokes in over ~260ms after a clean parse. |
| Mode toggle (mobile) | Cross-fade, 160ms. |

**All of the above is gated by `prefers-reduced-motion: reduce`** — reduced motion swaps every transition for an instant state change; the brass dot/check appears without animating.

---

## 7. Signature — The ATS Lens

The one element this product is remembered by. A persistent Plex-Mono readout that renders **the machine's view of the document**, turning the invisible ATS-compatibility contract into something the user can watch in real time.

```
┌ ATS VIEW ──────────────────────────┐
│ ✓ Text layer          detected      │
│ ✓ Reading order       linear        │
│ ✓ Sections            Experience,   │
│                       Education,     │
│                       Skills         │
│ · Fonts               Roboto (embed) │
└─────────────────────────────────────┘
```

- Checks are **brass** when passing. A failing check (e.g. a non-linear layout detected) turns brick and states the fix in plain language.
- Mono type is load-bearing here: it signals "this is the parser talking," reinforcing the Two Readers thesis every time the user glances right.
- On mobile it collapses to one chip: `ATS ✓ 3 sections` → tap to expand.

This directly visualizes the three hard ATS constraints from `architecture.md` (text layer, linear order, semantic sections), so the design and the spec stay honest with each other.

---

## 8. Voice & Microcopy

Plain, active, sentence case. Actions keep the same verb through the whole flow.

| Surface | Copy |
|---------|------|
| Export button | `Export PDF` → toast `Exported Senior-Engineer-CV.pdf` |
| Save state | `Saved · 12:03` (never "Submitting…") |
| Add entry | `Add experience`, `Add education` |
| Empty dashboard | **Fraunces:** `Two readers. One resume.` / **body:** `Start one and see it the way a recruiter — and a parser — will.` / `[ New resume ]` |
| ATS pass | `Ready for ATS` |
| ATS fail | `Two columns in Experience may scramble the reading order. Switch to a single column.` (what happened + the fix, in the interface's voice) |
| Export error | `Couldn't build the PDF. Your work is saved — try Export again.` (no apology, reassure + next step) |

---

## 9. Accessibility Floor (non-negotiable)

- **Contrast:** body/UI text meets WCAG AA on both themes. Brass is restricted to large text, icons, and borders — never small body copy.
- **Focus:** every interactive element shows a visible focus ring (2px petrol/teal, offset); never `outline: none` without a replacement.
- **Keyboard:** full keyboard path through the editor; `Esc` closes overlays; the Edit/Preview toggle is reachable and announced.
- **Motion:** `prefers-reduced-motion` respected everywhere (§6).
- **Semantics:** antd `Form` labels bound to inputs; ATS Lens statuses exposed as `aria-live="polite"` so a passing/failing check is announced, not just colored.
- **Target size:** interactive controls ≥ 40px on touch; the fixed export bar sits above the safe-area inset.

---

## 10. Implementation Reference — `ConfigProvider`

Drop-in starting point wiring §2–§5 into antd v5. Wrap it under `AntdRegistry` (`@ant-design/nextjs-registry`) in the root layout to avoid SSR style flicker with the App Router.

```tsx
import { theme, type ThemeConfig } from 'antd';

const shared = {
  borderRadius: 10,
  borderRadiusSM: 6,
  controlHeight: 36,
  fontSize: 15,
  wireframe: false,
  fontFamily: "'Inter', system-ui, sans-serif",
};

export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...shared,
    colorPrimary: '#0F5C57',
    colorBgLayout: '#EAEDEB',
    colorBgContainer: '#FFFFFF',
    colorText: '#16211F',
    colorTextSecondary: '#586662',
    colorBorder: '#D8DDDA',
    colorSuccess: '#2E7D5B',
    colorWarning: '#B8862A',
    colorError: '#B23A48',
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...shared,
    colorPrimary: '#39A99E',
    colorBgLayout: '#0D1413',
    colorBgContainer: '#151D1B',
    colorBgElevated: '#1E2826',
    colorText: '#E7ECEA',
    colorTextSecondary: '#9DABA6',
    colorBorder: '#2A3532',
    colorSuccess: '#4FB07F',
    colorWarning: '#D6A24C',
    colorError: '#D3707A',
  },
};

// Brass (--brass) and the preview-paper color are NOT antd tokens —
// they live as CSS variables so the preview sheet can ignore the theme:
//   :root        { --brass:#B07D2B; --paper:#FFFFFF; }
//   [data-dark]  { --brass:#D6A24C; --paper:#F7F7F4; }
```

> **Guardrail for future work:** the preview paper (`--paper`) and the ATS Lens are the two things that carry the whole concept. If a change would dim the paper in dark mode, or replace the mono ATS readout with generic UI, stop — that erases the thesis.
