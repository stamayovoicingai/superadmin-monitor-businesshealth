# 15 · Roadmap & Open Questions

## 1. Build roadmap (demo)

### Phase 0 — Foundation
- Next.js + TS + Tailwind + shadcn scaffold; brand tokens (doc 14); fonts.
- Data-access layer (interfaces + MockAdapter), `/lib/engine` (cost/revenue/margin/MRR),
  `/lib/seed` (3 orgs, ~6 projects, calls).
- Auth policy module + View-as switcher; app shell (sidebar/topbar, doc 02).

### Phase 1 — Cost-first core (priority #1)
- Cost & Margin module (doc 03/05): KPIs, cost-by-service, margin table, per-call breakdown.
- Call Logs + Call Detail (transcript, recording, latency, cost, error logs).
- Overview landing (role-aware).

### Phase 2 — Operations
- Live Operations (doc 07) with simulated streaming.
- Performance + Issues + Thresholds (doc 05).
- Call Flagging + review queue (doc 10).

### Phase 3 — Infra & controls
- Kubernetes + AWS ELB dashboards (doc 06) from Grafana specs.
- Fallback controls STT/TTS/LLM (doc 08).

### Phase 4 — Business
- Business Health metrics (doc 09): usage + MRR/churn/growth/expansion.

### Phase 5 — Backend-ready
- SupabaseAdapter behind the same interfaces; seed → Supabase; RLS mirroring `can(...)`.

### Phase 6 (later) — QA Bench / Evals
- Build doc 11 (evaluators, schedules, thresholds, auto-flag, pause). Revenue model TBD.

---

## 2. Consolidated open questions

### Cost / Revenue (doc 03) — high priority
- [x] MGF mechanics → **B1** (included volume; overage on excess).
- [x] User sees cost-to-serve (not revenue/margin).
- [x] Per-service **markups** → **No**. Revenue = minutes/MGF only (field kept in contract, inactive).
- [x] Cloud allocation method → **talk-minutes** (confirmed).
- [ ] Real pricing rates & contract terms to replace illustrative seeds.
- [ ] Currency — USD only? (assumed yes.)

### Data / Infra (doc 04, 06, 07)
- [ ] Full `status` enum on calls (beyond ACTIVE).
- [ ] Namespace → project mapping convention.
- [ ] Additional Grafana dashboards to mirror? (provide JSON)
- [ ] Real refresh cadence for Live Ops (15s vs 30s).

### Observability (doc 05)
- [ ] Default threshold values (latency/error/cost).
- [ ] Disposition taxonomy.

### Fallbacks (doc 08)
- [ ] STT/TTS ordered-list support (like LLM) or single fallback only?
- [ ] Outage detection signal source.

### Business (doc 09)
- [ ] Caller identity definition (hashed MSISDN?).
- [ ] Churn window definition.
- [ ] Real billing integrated or modeled from seeds?

### Flagging / QA Bench (doc 10, 11)
- [ ] Who resolves flags / triggers agent pause (User vs SuperAdmin).
- [ ] Which 2 eval libraries; Evals revenue model (credits vs included).

### Platform (doc 13, 14)
- [x] Backend → **Supabase connected from Phase 0** (not mock-only).
- [x] Theme → **light default + dark toggle**.
- [ ] Hosting target (Vercel project?).
- [ ] Logo SVG assets.

---

## 3. Assumptions (proceeding unless told otherwise)
- USD only; light mode default; small curated seed (3 orgs / ~6 projects).
- Two roles (SuperAdmin/User), both internal; Org-Admin tier deferred but schema-ready.
- LLM fallback scoped to bot-conversation LLM for MVP.
- Business metrics modeled from seeded contracts (no live billing integration in demo).
- QA Bench designed, not built, in v1.
