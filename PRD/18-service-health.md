# 18 · Module: Service Health (Uptime-Kuma style)

Track the health of every service platform.voicing.ai depends on — **external dependencies**
(providers) and **internal services** (per project) — with status, uptime, heartbeats and incidents,
plus **email notifications** when a service degrades or goes down. Route: `/health`. Both roles.

---

## 1. Services

- **External dependencies** (global, shared): OpenAI, Anthropic, Google, Deepgram, AssemblyAI,
  ElevenLabs, Cartesia, Twilio, AWS, GCP — categorized LLM / STT / TTS / Telephony / Cloud.
- **Internal services** (per project): Call Orchestrator, STT Pipeline, TTS Pipeline, LLM Router,
  Webhooks, Recordings Storage.

Each service has: `status` (operational / degraded / down / maintenance), **uptime %** (30d),
**response time**, last check, and a **heartbeat bar** (recent checks) — Uptime-Kuma style.

Scope: when a **project** is selected you see its internal services + the external dependencies;
an **org** shows its projects' internals; with no scope, externals + a hint to pick a scope.

## 2. Incidents — with affected projects

Any non-operational service produces an **incident** showing status, start time, and — critically —
the **affected projects**. For an external provider this is computed from which projects use that
provider (their model mix); for an internal service it's the owning project. This ensures alerts make
clear *which projects an outage impacts*.

## 3. Notifications

- **Per-project recipient list** (emails) — managed on the page (add/remove).
- **Per-service override** — critical services can have their own recipients (overrides the project list).
- Recipients are notified on **degraded**, **down** and **recovery**, and the notification includes the
  **affected projects**.

## 4. Data & API

- `HealthService`, `HealthIncident`, `NotifyRecipients`, `ServiceNotifyOverride` (PRD/12 to extend).
- `DataSource.health(scope)` → services (scoped) + incidents + status summary + recipients + overrides.
- `setRecipients` / `setServiceOverride`. API `/api/health` (GET, PUT). Page auto-refreshes every 30s.

## 5. Open questions
- [ ] Real health source in production (synthetic checks / provider status pages / Prometheus probes).
- [ ] Delivery channel beyond email (Slack/PagerDuty/webhook).
- [ ] Maintenance windows + acknowledgement workflow for incidents.
