# [BE] Service Health · API · Health checks, status & incidents

- **ID:** `HEALTH-BE1`
- **Type:** Backend
- **Epic:** Service Health
- **Feature:** F1 — Health checks & incidents API
- **Priority:** P2
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `HEALTH-BE2`, `HEALTH-FE1`, `HEALTH-QA1`
- **Components/Labels:** `backend` `python` `supabase` `api` `observability`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`HealthResult`), `src/lib/data/mock.ts` (`health`), `PRD/18`

## What
Compute and serve real health for external dependencies (OpenAI/Anthropic/Google/Deepgram/AssemblyAI/
ElevenLabs/Cartesia/Twilio/AWS/GCP) and internal per-project services (orchestrator, STT/TTS pipeline,
LLM router, webhooks, recordings storage): status, 30d uptime %, response time, heartbeats, and active
**incidents** with the list of **affected projects**.

## Why
Track platform health and know exactly which projects an outage impacts so the right teams act.

## How (building on the MVP)
- Honor `HealthResult`. Replace mock series with real checks: synthetic probes / provider status pages /
  Prometheus blackbox; store heartbeats + compute uptime.
- **Affected projects**: for an external provider, derive the projects that use it from each project's
  model mix (mirror the MVP's `projectsUsingProvider`); internal services map to their project.
- Scope: project → its internals + externals; org → its projects' internals + externals.

## Acceptance Criteria
- [ ] Real status/uptime/response/heartbeats per service; incidents created when non-operational.
- [ ] Incidents list correct affected projects (provider→projects mapping verified).
- [ ] Scope filtering matches the MVP behavior; refresh ≤ the dashboard cadence.
- [ ] History retained for uptime % and heartbeat bars.
