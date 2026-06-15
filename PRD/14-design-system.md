# 14 · Design System

**Extracted from the live site [voicing.ai](https://www.voicing.ai/)** (Marketing brand): warm cream
backgrounds, a vivid orange accent, near-black ink, and **Inter** (UI) + **Instrument Serif** (display).
Implemented as tokens in `src/app/globals.css`; a live reference renders at **`/design`** (the Design
System showcase) so frontend devs reuse primitives instead of hardcoding.

> Logo: waveform/equalizer mark. Tagline: "AI where it scales. Humans where it matters."

---

## 1. Color tokens (from voicing.ai)

| Token | Hex (light) | Use |
|-------|-----|-----|
| `--primary` | `#DA5326` | Primary actions, active nav, key series (site `--color-accent`) |
| `--background` | `#F9F7F4` | App background (warm cream, site `--color-bg`) |
| `--card` | `#FFFFFF` | Cards, panels, tables |
| `--foreground` | `#1B1714` | Headings / primary text (warm near-black) |
| `--muted-foreground` | `#6F6A63` | Secondary text, captions, axis labels |
| `--accent` | `#F7E7DF` | Subtle peach hover surfaces |
| `--border` | `#E6DFD2` | Borders, dividers, inputs |
| `--success` | `#16A34A` | Live/healthy, positive margin |
| `--warning` | `#C2700A` | Warning severity (amber — distinct from primary orange) |
| `--critical` | `#DC2626` | Critical severity, errors, breached thresholds |

**Chart palette (distinguishable on cream):** orange `--chart-1 #DA5326` · blue `#2F6DF0` ·
green `#16A34A` · ink `#3A352F` · tan `#B08968`. Cost-by-service uses fixed hues per service.

**Sidebar** is **dark** (`#1B1714`, cream text) — echoing the site's dark sections — for contrast
against the cream content area.

**Dark mode:** warm near-black surfaces (`#17150F` bg, `#201D16` cards), cream text, brighter orange
(`#E2683C`). All tokens in `globals.css` (`:root` + `.dark`).

---

## 2. Typography

| Role | Font | Usage |
|------|------|-------|
| Display | **Instrument Serif** (`font-display`) | page titles + KPI numbers (the brand "hero" feel) |
| UI / body / labels | **Inter** (`font-sans`) | everything else; weights 300–700 |
| Code / IDs | **Geist Mono** (`font-mono`) | call ids, hosts, JSON |

Scale (site-derived): xs `.75rem` · sm `.875rem` · base `1rem` · lg `1.125rem` · 2xl `1.5rem` ·
display `1.75–2.5rem` (Instrument Serif). Tracking normal/wide/wider; leading tight/snug/normal/relaxed.

---

## 3. Shape & spacing

| Element | Radius |
|---------|--------|
| Card | **12px** (0.75rem) |
| Button | **pill** (9999px) |
| Badge / chip | ~7px |
| Input | ~9px |

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32. Cards: white, 10px radius, subtle border (`--border`),
soft shadow. Grid: 12-col responsive; dense data tables.

---

## 4. Components (shadcn/ui mapped to brand)

- **Buttons:** pill. Primary = Blue fill; Secondary = Violet; Ghost/outline for tertiary.
  (Brand examples: "+ Create New Bot", "✦ Use this template", "→ Request Demo", "↑ Import JSON".)
- **Status chips:** ● Live (green) · ■ Online (blue) · ■ Paused (orange) · severity chips
  (Warning orange / Critical red). 6px radius.
- **KPI cards / StatPanel:** big number + label + Δ vs previous (green up / red down by metric polarity).
- **Panels:** Gauge, Stat, Timeseries, BarGauge, Log (doc 06 §3).
- **DataTable:** TanStack-based; sticky header, sort, filter, pagination, row→detail.
- **Nav:** left sidebar with section groups (doc 02); active item Blue; 🔒 sections hidden by role.
- **Severity & health:** consistent color language across Issues, thresholds, margin flags.

---

## 5. Logo & branding usage
- Use the waveform mark + "Voicing AI" wordmark; light-bg variant in the app.
- App header may show "Agent for Agent" platform lockup per brand kit.
- Confidential / internal — no external distribution of the demo without sign-off.

## 6. Implementation
- Tokens as CSS variables + Tailwind theme extension in `/lib/design`.
- Fonts via `next/font` (Plus Jakarta Sans, Inter).
- shadcn theme configured to brand tokens (not defaults).

## 7. Open questions
- [ ] Confirm light mode as default (assumed: yes, per Platform `#F4F5FA` bg) vs dark-first.
- [ ] Obtain logo SVG assets (mark + wordmark) — currently approximated.
