# [BE] Fallbacks · Enforcement · Wire configs into the call pipeline

- **ID:** `FALLB-BE2`
- **Type:** Backend
- **Epic:** Fallback Controls
- **Feature:** F2 — Pipeline integration (enforcement)
- **Priority:** P3
- **Blocked by:** `FALLB-BE1`
- **Blocks:** `FALLB-QA1`
- **Components/Labels:** `backend` `python` `voice-pipeline` `reliability`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/08`

## What
Make the voice pipeline **actually use** the fallback configs: on per-call provider error/timeout, and
on platform-wide provider outage, switch STT/TTS to the configured fallback and LLM to the next model
in the ordered list — emitting `fallback_event` records.

## Why
The MVP only stores config; the value is realized only when the runtime honors it (resilience to
provider failures). LLM scope for MVP = bot-conversation LLM.

## How (building on the MVP)
- Read the effective config (scope resolution) from `FALLB-BE1` at call time.
- Per-call trigger: retry on the fallback when the primary errors/times out. Platform-wide: detect
  provider outage (status API/error-rate) and switch in-scope traffic until cleared.
- LLM: try models in the defined order (respect order, not live-cheapest). Emit `fallback_event`
  (when, scope, call, from→to, reason) — surfaced in the UI activity log.
- Scope to bot-conversation LLM for MVP (extensible later).

## Acceptance Criteria
- [ ] Per-call STT/TTS/LLM failures fall back per config; calls recover instead of failing.
- [ ] Platform-wide outage switches in-scope traffic and reverts on recovery.
- [ ] LLM order is respected; `fallback_event`s are emitted and visible in the activity log.
- [ ] Scope override (project/org/global) is honored at runtime.
