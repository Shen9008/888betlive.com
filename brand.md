# PG Asia Games — Brand & UI System

Single source of truth for **spacing**, **type scale**, **radius**, **buttons**, and **modular sections**. Implement changes in [`css/variables.css`](css/variables.css) and shared components—not ad‑hoc per page.

---

## 1. Spacing hierarchy

Spacing is stepped in **six levels**. Use tokens only (`var(--space-*)`). Do not introduce arbitrary `margin`/`padding` values for layout unless fixing a one-off bug and then prefer aligning to the nearest token.

| Token | Value | Typical use |
|--------|-------|--------------|
| `--space-xs` | `0.25rem` (4px) | Tight gaps inside a control, micro-alignment |
| `--space-sm` | `0.5rem` (8px) | Icon-to-label gap, stacked metadata, small headings under titles |
| `--space-md` | `1rem` (16px) | Default inner padding for compact blocks, FAQ/list rhythm |
| `--space-lg` | `1.5rem` (24px) | **Container horizontal padding** (with safe area), card padding, section icon offset |
| `--space-xl` | `2rem` (32px) | Space **below section headers**, larger vertical rhythm between groups |
| `--space-2xl` | `3rem` (48px) | **Vertical section padding** (`.section` top/bottom) |

**Hierarchy rule:** outer layout uses **lg → xl → 2xl**; inner content uses **xs → sm → md**. Section vertical rhythm: section block `2xl`, header block `xl`, title-to-subtitle `sm`.

---

## 2. Typography hierarchy

**Families**

- Body / UI: `var(--font-primary)` — Inter stack (see `variables.css`).
- Headings: `var(--font-heading)` — Outfit stack.

**Display & headings** (from `base.css`; mobile first, then `min-width: 768px`)

| Level | Mobile | ≥768px | Role |
|-------|--------|--------|------|
| `h1` | `2.25rem` | `3rem` | Page / hero title |
| `h2` | `1.75rem` | `2.25rem` | Major section title |
| `h3` | `1.35rem` | `1.5rem` | Subsection, card titles |
| `h4` | `1.15rem` | — | Minor headings, dense UI |

**Body & supporting**

- Default body: inherits `1.6` line-height on `body`; no fixed `font-size` on `body` (browser default ~16px base).
- Section subtitle: `.section__subtitle` — `1rem`, `var(--text-secondary)`.
- Muted / secondary copy: `var(--text-secondary)` or `var(--text-muted)` as appropriate.

**Letter-spacing**

- Headings: `var(--tracking-tight)` on `h1–h6`.
- Uppercase buttons: component uses `letter-spacing: 0.5px` (part of `.btn`).

**Do not** invent new heading sizes per page; extend the scale in `base.css` if a new level is truly needed.

---

## 3. Border radius hierarchy

All radii come from tokens in `variables.css`. **Pill** and **circle** are special cases.

| Token | Value | Use |
|-------|--------|-----|
| `--radius-sm` | `6px` | Small chips, compact UI, table-like rows, tight inputs |
| `--radius-md` | `10px` | **Default buttons** (`.btn`), medium panels, FAQ items, inline media frames |
| `--radius-lg` | `14px` | **Cards** (`.card`), tables (`.info-table`), large feature panels, hero-style blocks |
| `--radius-xl` | `20px` | Reserved for extra-large surfaces when needed (prefer `lg` first for consistency) |
| `50%` | circle | Avatars, round icon wells, numbered badge circles |
| `999px` | pill | Nav pills, tags, fully rounded capsules |

**Button radius (explicit):** all `.btn` variants (`.btn--primary`, `.btn--outline`, `.btn--gold`) share **`var(--radius-md)`** on the base `.btn` class. Size modifiers (`.btn--sm`, `.btn--lg`) change padding and font size only—not corner radius—so **primary, outline, and gold stay visually consistent**.

**Cards vs buttons:** cards are **`radius-lg`**; buttons are **`radius-md`**. That keeps CTAs slightly tighter than content containers and avoids “everything same roundness.”

---

## 4. Button hierarchy

Structure: **base** `.btn` + **variant** + optional **size**.

| Variant | Purpose | Visual |
|---------|---------|--------|
| `.btn--primary` | Main CTA | Gold gradient, light text, strong shadow / glow on interaction |
| `.btn--gold` | High-emphasis alternate (dark text on gold) | Brighter gold gradient |
| `.btn--outline` | Secondary / less dominant | Transparent + gold border; fills gold on hover |

| Modifier | Padding | Font size |
|----------|---------|-----------|
| (default) | `var(--btn-padding-y)` `var(--btn-padding-x)` | `var(--btn-font-size)` |
| `.btn--sm` | `var(--btn-padding-y-sm)` `var(--btn-padding-x-sm)` | `var(--btn-font-size-sm)` |
| `.btn--lg` | `var(--btn-padding-y-lg)` `var(--btn-padding-x-lg)` | `var(--btn-font-size-lg)` |

Declared in **`variables.css`** as `--btn-*` so sizing stays centralized with other tokens.

**Hierarchy rule:** one **primary** (or **gold** if you need dark label) per logical group; **outline** for secondary actions. Keep label copy short; `.btn` is uppercase with semibold weight per component styles.

---

## 5. Modular sections & DRY

**CSS**

- Page vertical bands: **`.section`** (`padding: var(--space-2xl) 0`). Optional **`.section--dark`** for alternate background.
- Repeated header pattern: **`.section__header`**, **`.section__title`**, **`.section__subtitle`**, optional **`.section__header--with-icon`** + **`.section__icon`**.
- Content width: **`.container`** (`max-width: var(--container-max-width)` — `1200px` in `variables.css`; horizontal padding from `--space-lg`).

**HTML / partials**

- Shared chrome lives under **`partials/`** (e.g. `header.html`, `footer.html`, promo strips). New pages should **include the same partials** and the same section/card/button classes rather than duplicating markup.
- When a block repeats across pages (hero, promo, FAQ list), prefer **one class pattern** (existing BEM-style blocks in `components.css`) over copy-pasting new class names.

**DRY checklist**

1. Spacing: only `--space-*` tokens for layout spacing.
2. Radius: only `--radius-*`, `999px` pill, or `50%` circle—no random `8px` / `12px` unless added as a new token.
3. Buttons: always `.btn` + variant + optional size.
4. Sections: `.section` + `.container` + `.section__header` family when introducing a new band.

---

## 6. Color roles (dark & gold)

Visual identity: **near-black surfaces**, **white / off-white typography**, **gold as the single accent** (dividers, links, highlights, CTAs). Implement with tokens—not one-off hex on pages.

| Role | Typical token | Notes |
|------|----------------|-------|
| Page / section background | `--dark-bg`, `--darker-bg` | Alternate bands with `.section--dark` |
| Card / inset panels | `--card-bg`, `--card-bg-hover` | Tables, FAQs, list cards |
| Primary text | `--text-primary` | Headlines, high-emphasis UI |
| Body / supporting copy | `--text-secondary` | Paragraphs inside `.content-page`, subtitles |
| Muted meta | `--text-muted` | Labels, captions |
| Accent / borders / rules | `--primary`, `--primary-light`, `--border-color` | H2 underline, links, outlines |
| Primary CTA fill | `--gradient-primary` via `.btn--primary` | Gold gradient |

Links in body copy use **`a`** styles (`--primary-light` → `--primary` on hover) so key phrases read as gold without extra classes.

---

## 7. Editorial content module (`.content-page`)

Use for **long-form / marketing copy** in a section: title and lead, gold **section rule** under in-page `h2`s, paragraphs, optional CTA. Canonical flow: **heading → gold divider → body → `.btn`**.

| Element | Role |
|---------|------|
| `.content-page` | Wrapper; **full width of `.container`** (same `max-width` as site chrome via parent). |
| `.content-page__title` | Opening headline (`2rem`) |
| `.content-page__lead` | Intro / dek (`1.1rem`, `--text-secondary`, `line-height ~1.7`) |
| `h2` | **`border-bottom: 2px solid var(--primary)`** + `padding-bottom: 0.5rem` — the gold rule under the heading |
| `h3` | Subsections |
| `p`, lists | `--text-secondary`; vertical rhythm `--space-md` / `--space-lg` |
| `.btn` + variant | e.g. **`.btn--primary`** after a block (gold gradient, uppercase label) |

**Alignment:** default **start-aligned** text and buttons inside `.content-page` unless a block explicitly needs centering.

Extend **`.content-page`** in `components.css` with modifiers if the pattern evolves—avoid one-off page classes.

---

## 8. Color & motion (technical reference)

Gradients, shadows, and transitions live in **`variables.css`** (`--gradient-*`, `--shadow-*`, `--transition-*`). Prefer tokens over raw values in new CSS.

---

*When tokens or components change, update this file in the same change so the documentation stays aligned with the codebase.*
