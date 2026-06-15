# [BE] Cost & Margin · Cost ingestion · Effective-dated pricing catalog

- **ID:** `COST-BE2`
- **Type:** Backend
- **Epic:** Cost & Margin
- **Feature:** F1 — Cost ingestion & pricing engine
- **Priority:** P1
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `COST-BE1`
- **Components/Labels:** `backend` `python` `supabase` `cost` `pricing`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/engine/pricing.ts`, `PRD/03-cost-revenue-margin.md` §2.2

## What
A versioned, **effective-dated** pricing catalog for every billable provider/model: LLM ($/1M input &
output tokens), STT ($/min), TTS ($/1k chars), telephony ($/min by direction/region), cloud (compute/
storage/egress). Historical calls keep the price that was in effect when they happened.

## Why
Provider prices change. Cost accuracy and auditability require pricing to be data (not hardcoded) and
time-aware, so re-computing a past month yields the same number it did then.

## How (building on the MVP)
- The MVP hardcodes illustrative rates in `pricing.ts` (`LLM_RATES`, `STT_RATES`, `TTS_RATES`,
  `TELEPHONY_RATE_PER_MIN`, `CLOUD_RATE_PER_MIN`). Replace with Supabase tables
  `pricing_llm/pricing_stt/pricing_tts/pricing_telephony/pricing_cloud`, each with `valid_from`/
  `valid_to` (see `PRD/12-data-model.md` §3).
- The ingestion job (BE-1) looks up the rate effective at the call's `start_time`.
- Provide an admin path to update rates (seed real, confirmed rates — the MVP values are placeholders).
- Keep amounts in micro-USD.

## Acceptance Criteria
- [ ] Pricing tables exist with effective-dating; overlapping ranges are rejected.
- [ ] Cost computation selects the rate effective at the call timestamp (verified with a date-boundary test).
- [ ] All MVP-catalogued providers/models are represented with real rates.
- [ ] Updating a rate does not retroactively change already-priced historical calls.
