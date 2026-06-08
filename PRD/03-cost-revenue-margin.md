# 03 · ⭐ Cost / Revenue / Margin Engine (Priority #1)

This is the heart of the platform. Everything else hangs off the ability to answer, for any
call / project / org / time-range:

> **What did it cost us? What did we charge? What is the margin?**

---

## 1. Core concepts

| Term | Definition | Owner |
|------|------------|-------|
| **Cost (COGS)** | Voicing's real cost to operate, summed across services. | Provider pricing × usage |
| **Revenue** | What Voicing bills the org (usage and/or MGF). | Contract model |
| **Gross margin** | `Revenue − Cost`. | Derived |
| **Margin %** | `(Revenue − Cost) / Revenue`. | Derived |
| **Cost per call** | Cost of a single call, broken down by service. | Derived |

All money is stored in **USD micro-units (integer, 1e-6 USD)** to avoid float drift; formatted for display.

---

## 2. Cost model — services & pricing

Cost is computed bottom-up: **per call**, sum the cost of each service from **provider pricing
tables × measured usage**. Pricing tables are versioned and effective-dated so historical calls
keep their true cost.

### 2.1 Billable services & usage units

| Service | Usage unit captured per call | Pricing unit |
|---------|------------------------------|--------------|
| **LLM** | input tokens, output tokens (per provider/model) | USD / 1M input tokens, USD / 1M output tokens |
| **STT** | audio seconds/minutes transcribed | USD / minute (or / second) |
| **TTS** | characters synthesized (or seconds) | USD / 1k characters (or / second) |
| **Telephony** | call minutes (inbound/outbound, region) | USD / minute |
| **Cloud / Infra** | allocated compute/storage/network share | see §4 (allocation) |

### 2.2 Provider catalog (seed)

Pricing tables are seed data; values are illustrative and editable. **Confirm real rates before any
external use.**

- **LLM:** OpenAI (GPT-4.1, GPT-4o, GPT-4o mini), Anthropic (Claude Sonnet, Claude Haiku),
  Google (Gemini 1.5 Pro, Gemini Flash). Fields: `input_per_1m`, `output_per_1m`.
- **STT:** Deepgram (Nova), OpenAI Whisper, AssemblyAI. Field: `per_minute`.
- **TTS:** ElevenLabs, Cartesia, OpenAI TTS. Field: `per_1k_chars` (+ optional `per_second`).
- **Telephony:** Twilio (per-minute, by direction/region).
- **Cloud:** AWS, GCP, Azure (compute, storage for recordings, egress).

### 2.3 Per-call cost formula

```
call_cost =
    llm_input_tokens/1e6  × llm.input_per_1m
  + llm_output_tokens/1e6 × llm.output_per_1m
  + stt_minutes           × stt.per_minute
  + tts_chars/1000        × tts.per_1k_chars
  + telephony_minutes     × telephony.per_minute
  + cloud_alloc_for_call            (see §4)
```

Each addend is stored so the UI can show a **per-service breakdown** for any aggregation.

---

## 3. Revenue model — billing contracts

Revenue is **per-org contract-driven**. Two contract types in v1 (from discovery):

### 3.1 Contract type A — Pure Usage (e.g., TP Latam)

Billed purely on consumption. No floor.

```
revenue(period) = Σ billable_minutes × org.rate_per_min     (+ optional per-service markups)
```
- MRR contribution = trailing run-rate of usage (e.g., last 30d normalized).

### 3.2 Contract type B — Minimum Guarantee Fee (MGF)

A monthly floor. If consumption exceeds what the MGF covers, the org pays **MGF + overage**.

```
included_minutes = org.mgf_amount / org.rate_per_min        (the volume the MGF "buys")
overage_minutes  = max(0, billable_minutes − included_minutes)

revenue(month) = org.mgf_amount + overage_minutes × org.overage_rate_per_min
               = max(org.mgf_amount,  ... )   when usage ≤ included
```
- MRR contribution = `mgf_amount` (committed floor); overage is recognized as variable revenue on top.

> ✅ **Confirmed (Jun 2026).** The MGF **includes a volume** of minutes; overage is billed **only on
> minutes above** that included volume — i.e. `revenue = mgf_amount + overage_minutes × overage_rate`,
> floored at `mgf_amount`. (Reading **B1**, modeled above.)

### 3.3 Contract configuration (per org)

| Field | Type | Applies to |
|-------|------|-----------|
| `contract_type` | `pure_usage` \| `mgf` | all |
| `rate_per_min` | USD/min | both |
| `mgf_amount` | USD/month | mgf |
| `overage_rate_per_min` | USD/min | mgf |
| `included_minutes` | derived or explicit | mgf |
| `billing_cycle_day` | 1–28 | both |
| `currency` | USD (v1) | both |
| per-service markups (optional) | % | both |

---

## 4. Cloud / Infra cost allocation

Infra (k8s compute, ELB, storage, egress across AWS/GCP/Azure) is **shared** and must be
**allocated to projects** to compute true per-project margin. Allocation method (configurable;
default **by talk-minutes**):

| Method | Allocation key | When to use |
|--------|----------------|-------------|
| **By talk-minutes** (default) | project_minutes / total_minutes | Simple, fair for voice workloads. |
| By active-call-seconds | concurrency-weighted | Better if heavy concurrency dominates compute. |
| By pod ownership | namespace/pod → project map | When projects map cleanly to namespaces (the Grafana data supports this — see doc 04). |

```
cloud_cost(project, period) = total_cloud_cost(period) × allocation_key(project, period)
cloud_alloc_for_call        = cloud_cost(project, period) × (call_minutes / project_minutes(period))
```

> The k8s dashboard already groups by `namespace` / `deployment` and the call DB has `host_id`
> (pod). This makes **pod→project** allocation feasible later; v1 default stays talk-minutes for simplicity.

---

## 5. Aggregation & margin

Margin rolls up at three levels, each with the same per-service decomposition:

| Level | Cost | Revenue | Margin |
|-------|------|---------|--------|
| **Call** | sum of services | allocated share of contract* | rev − cost |
| **Project** | Σ calls + allocated cloud | Σ call revenue (or project share of MGF) | rev − cost |
| **Org** | Σ projects | contract revenue (usage and/or MGF) | rev − cost |

\* Per-call revenue under an MGF contract is an **allocation** of monthly contract revenue down to
calls (by minutes) — useful for per-call margin views, reconciled to the monthly contract total.

---

## 6. UI surfaces (the "Cost & Margin" module)

1. **KPI strip:** Total Cost · Total Revenue · Gross Margin · **Margin %** (vs. previous period Δ).
2. **Cost by service** — stacked area over time (LLM/STT/TTS/telephony/cloud).
3. **Margin by org / by project** — sortable bar + table.
4. **Cost vs Revenue** — dual line per project/org.
5. **Margin table** — columns: project · org · calls · cost · revenue · margin · **margin %** ·
   cost/call · rev/call. Sort & filter. Red flag when margin % < threshold.
6. **Per-call drill-down** — Call Detail shows the per-service cost breakdown + the call's revenue
   contribution + margin.
7. **Cost outliers** — calls whose cost/call exceeds the cost threshold (ties into Issues, doc 05).

## 7. Data model (engine entities — preview)

Full schema in doc 12. Engine-relevant tables:

- `pricing_llm`, `pricing_stt`, `pricing_tts`, `pricing_telephony`, `pricing_cloud`
  — each effective-dated (`valid_from`, `valid_to`).
- `org_contract` — fields in §3.3.
- `call` — usage columns: `llm_input_tokens`, `llm_output_tokens`, `llm_model`, `stt_minutes`,
  `stt_model`, `tts_chars`, `tts_model`, `telephony_minutes`, `host_id`, …
- `call_cost` (materialized/derived) — per-service cost addends + `total_cost`.
- `period_rollup` — daily/monthly cost+revenue+margin per project/org (for fast charts).

## 8. Backend-ready notes

- Costs are computed in a pure function `computeCallCost(usage, pricingAsOf)` shared by mock seed
  generation and the future ETL — same logic, two data sources.
- In production, **real cost** comes from reconciling provider billing exports against measured
  usage; the demo approximates with pricing tables but keeps the exact same shape, so swapping in
  reconciled numbers is transparent.

## 9. Open questions

- [x] **MGF mechanics** — confirmed **B1** (MGF includes a volume; overage on excess only). §3.2.
- [x] **`User` cost visibility** — confirmed: User **sees cost-to-serve (USD)** but never revenue/margin. (doc 01 §4)
- [ ] Do per-service **markups** exist in real contracts, or is revenue purely minute-based?
- [ ] Cloud allocation method preference (default: talk-minutes).
- [ ] Currency — USD only for v1? (assumed yes.)
