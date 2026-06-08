# 14 · Design System

Based on the official **Voicing AI Brand Kit (2024)**. The SuperAdmin is a **platform** product, so
it uses the **Platform brand** (`platform.voicing.ai`) — Indigo Blue + Violet on cool light gray —
**not** the marketing orange/cream identity.

> Brand name: **Voicing AI** · Platform: "Agent for Agent · AI Agent Platform" · Tagline:
> "AI where it scales. Humans where it matters." · Logo: waveform/equalizer mark.

---

## 1. Color tokens (Platform)

| Token | Hex | Use |
|-------|-----|-----|
| `--primary` | `#3B5BDB` | Primary actions, links, key data series, active nav |
| `--accent` | `#7C3AED` | Secondary emphasis, highlights, secondary series |
| `--bg-app` | `#F4F5FA` | App background (cool light gray) |
| `--bg-card` | `#FFFFFF` | Cards, panels, tables |
| `--text` | `#1E2060` | Headings / primary text (dark indigo) |
| `--text-muted` | `#667099` | Secondary text, captions, axis labels |
| `--border` | `#CDD0E0` | Borders, dividers, input outlines |
| `--success` | `#22C55E` | Live/online, healthy, positive margin |

**Semantic (derived for dashboards):**
| Token | Hex | Use |
|-------|-----|-----|
| `--warning` | `#DA5326` | Warning severity, Paused chip (reuses marketing orange) |
| `--critical` | `#DC2626` | Critical severity, errors, breached thresholds |
| `--info` | `#3B5BDB` | Informational |

**Chart series order:** Blue `#3B5BDB` → Violet `#7C3AED` → Green `#22C55E` → Orange `#DA5326` →
Muted `#667099`. Cost-by-service uses fixed hues per service for consistency across screens.

**Dark mode:** invert surfaces (`#0F1130`-ish app bg, `#1A1C3A` cards) keeping Blue/Violet/Green
accents; tokens defined in `/lib/design`.

---

## 2. Typography

| Role | Font | Spec |
|------|------|------|
| UI / body / labels | **Plus Jakarta Sans** | primary platform font |
| Fallback | **Inter** | secondary |
| Editorial only | Instrument Serif | rarely in-app (marketing) |

Scale (platform): Display 30px/800 · H1 24px/700 · H2 20px/700 · Body 13–14px/400 ·
Label 12px/600 (uppercase tracking) · Caption 10–11px/400.

---

## 3. Shape & spacing

| Element | Radius |
|---------|--------|
| Card | **10px** (0.625rem) |
| Button | **pill** (9999px) |
| Badge / chip | 6px |
| Input | 8px |

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
