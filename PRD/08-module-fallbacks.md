# 08 · Module: Fallback Controls (STT / TTS / LLM)

SuperAdmin-only controls (Features 2A, 3A, 4A). Define what the platform does when a provider
fails — per call (error/timeout) or platform-wide (provider outage). Org users/admins cannot
override these. Route: `/controls/fallbacks` with three tabs: **STT**, **TTS**, **LLM**.

In the demo these write to simulated config state (mock store / Supabase) and surface an audit
entry; no real routing change.

---

## 1. Shared concepts

| Concept | Meaning |
|---------|---------|
| **Primary model** | Current platform default for the service (read-only display). |
| **Trigger** | (a) **per-call** error/timeout on a single call; (b) **platform-wide** provider outage → switch all calls. Both enabled. |
| **Scope** | "All orgs" (global) **or** a specific org/project selector. Most-specific scope wins. |
| **Master toggle** | Enable/disable the fallback for that scope. |
| **Audit** | Every change records who/when/what (config-change log). |

A reusable `<FallbackConfig>` component renders all three tabs; only the model catalog differs
(low-custom principle).

---

## 2. STT Auto Fallback (Feature 2A)

Single fallback model.

**Fields**
- Primary STT model — read from platform default (display).
- Fallback STT model — dropdown of available STT providers/models (Deepgram, Whisper/OpenAI, AssemblyAI).
- Apply to — "All orgs" toggle **or** org/project selector.
- Enable/disable — master toggle.

**Behavior**: on per-call STT error/timeout → retry on fallback; on provider-wide outage → route all
in-scope calls to fallback until cleared.

---

## 3. TTS Auto Fallback (Feature 3A)

Identical structure to STT, for TTS providers (ElevenLabs, Cartesia, OpenAI TTS).

**Fields**: Primary TTS (display) · Fallback TTS (dropdown) · Apply to (All orgs / selector) · Enable toggle.

---

## 4. LLM Auto Fallback — Cost-Based Ordered List (Feature 4A)

Differs: an **ordered list** of models, tried in sequence on failure (not real-time cheapest).

**Fields**
- **Ordered model list** — drag-and-drop reorderable. Example:
  `GPT-4.1 → Claude Sonnet → Gemini Flash → GPT-4o mini`.
- Each entry shows: provider · model name · **cost per 1M tokens** (informational, from pricing tables).
- Apply to — "All orgs" toggle **or** org/project selector.
- Enable/disable — master toggle.

**Behavior**: primary fails/unavailable → try next in the defined order; platform **respects the
order** (does not auto-pick cheapest live).

**Scope (MVP)**: applies to **bot-conversation LLM only** (per the open-question recommendation).
Other LLM uses (Agent Builder, post-call analysis) are out of scope for v1; UI notes this.

---

## 5. UI surfaces

- Per tab: current config card(s) per scope, "Add scoped override" action, and a small **fallback
  activity** panel (recent fallback events: when, which call/scope, primary→fallback, reason) —
  ties to Issues (doc 05) when fallbacks spike.
- Drag-and-drop list for LLM with inline cost badges.
- Confirmation modal on changes affecting "All orgs".

## 6. Data
- `fallback_config` (service, scope, primary, fallback/ordered_list, enabled, updated_by, updated_at).
- `fallback_event` (timestamp, service, scope, call_id?, from_model, to_model, reason).
- Model catalog comes from the same pricing tables as doc 03 (provider, model, cost).

## 7. Role behavior
- **SuperAdmin only.** `User` does not see this section.

## 8. Open questions
- [x] LLM fallback scope for MVP → **bot-conversation LLM only** (confirmed recommendation).
- [ ] Are STT/TTS fallbacks single-model only, or should they also support an ordered list (like LLM)?
- [ ] Outage detection signal source (provider status API vs error-rate heuristic) — design only.
