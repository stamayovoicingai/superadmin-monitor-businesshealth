# 12 · Data Model (entities / Supabase)

Target schema for the demo (Supabase/Postgres), designed to **mirror the real call DB** (doc 04 S1)
so a future swap to production is a connection change, not a migration. Names follow the observed
Grafana SQL where applicable (`chat_conversations`, `conversation_details`, `chat_messages`,
`host_id`, `closed_reason`, …).

> Money: integer micro-USD (`*_micros`). Time: `timestamptz`. IDs: `uuid` (internal) + external string ids.

---

## 1. Entity overview

```
organization ─1─*─ project ─1─*─ agent ─1─*─ call ─1─1─ call_cost
     │                                  │
     │                                  ├─*─ chat_message
org_contract                            ├─*─ call_error_log
                                        ├─*─ call_flag ─*─ call_flag_comment
pricing_* (llm/stt/tts/telephony/cloud)
issue_category ─*─ threshold ─*─ issue ─*─ issue_affected_call
fallback_config ─*─ fallback_event
period_rollup        app_user        (Phase 2: evaluator, eval_schedule, eval_run, eval_result, eval_threshold)
```

---

## 2. Core tables

### organization
`id` · `name` · `created_at` · `status` (active/churned) · `onboarded_at`.

### project
`id` · `org_id` → organization · `name` · `namespace` (k8s, e.g. `telmex-bot-orchestration`) ·
`created_at` · `status`.

### agent
`id` · `project_id` → project · `name` · `status` (live/paused/online) · `created_at`.

### call  (mirrors `chat_conversations`)
| Column | Notes |
|--------|-------|
| `id` (uuid) / `call_id` (ext) / `session_id` | identifiers |
| `agent_id` · `project_id` · `org_id` | scoping |
| `host_id` | pod (active-calls-per-pod) |
| `start_time` · `end_time` · `call_duration_secs` | timing |
| `status` | `ACTIVE` \| `COMPLETED` \| `FAILED` … |
| `closed_reason` | `USER_IDLE`/`USER_DISCONNECTED`/`CALL_TRANSFERRED`/`CALL_END_PHRASE_TRIGGERED`/`OTHER` |
| `disposition` | outcome label |
| `caller_hash` | hashed MSISDN (unique/returning) |
| **usage:** `llm_model`,`llm_input_tokens`,`llm_output_tokens`,`stt_model`,`stt_minutes`,`tts_model`,`tts_chars`,`telephony_minutes` | for cost engine |
| **latency:** `latency_total_ms`,`latency_llm_ms`,`latency_stt_ms`,`latency_tts_ms`,`latency_tool_ms`,`latency_telephony_ms` | per-service |
| `recording_url` | object-storage pointer |

### conversation_details
Extended per-call record (joined by `session_id`/`call_id`) — denormalized detail for Call Detail.

### chat_message  (mirrors `chat_messages`)
`id` · `call_id`/`session_id` · `timestamp` · `role` · `content`.

### call_error_log
`id` · `call_id` · `timestamp` · `level` · `message` · `namespace` (Loki-style).

---

## 3. Cost / revenue tables (doc 03)

### pricing_llm / pricing_stt / pricing_tts / pricing_telephony / pricing_cloud
Effective-dated rate cards. Common: `id` · `provider` · `model` · `valid_from` · `valid_to`.
- llm: `input_per_1m_micros` · `output_per_1m_micros`
- stt: `per_minute_micros`
- tts: `per_1k_chars_micros` (+ `per_second_micros?`)
- telephony: `per_minute_micros` · `direction` · `region`
- cloud: `provider` (aws/gcp/azure) · `unit` · `unit_cost_micros`

### call_cost  (derived, 1:1 with call)
`call_id` · `llm_cost_micros` · `stt_cost_micros` · `tts_cost_micros` · `telephony_cost_micros` ·
`cloud_cost_micros` · `total_cost_micros` · `revenue_micros` · `margin_micros` · `pricing_asof`.

### org_contract  (doc 03 §3.3)
`org_id` · `contract_type` (`pure_usage`|`mgf`) · `rate_per_min_micros` · `mgf_amount_micros` ·
`overage_rate_per_min_micros` · `included_minutes` · `billing_cycle_day` · `currency` · markups (jsonb).

### period_rollup  (fast charts)
`id` · `grain` (day/week/month) · `period_start` · `org_id?` · `project_id?` ·
`calls` · `minutes` · `cost_micros` · `revenue_micros` · `margin_micros` · per-service cost cols ·
caller counts (new/returning) · active_agents.

---

## 4. Issues / thresholds

### issue_category
`id` · `name` · `is_default` · `created_by`. Seed: Infra, Compliance, Technical, Effectiveness.

### threshold
`id` · `metric` (latency_ms/error_rate/cost_per_call/…) · `severity` (critical/warning) ·
`comparator` · `value` · `scope_type` (global/org/project/agent) · `scope_id` · `category_id` · `enabled`.

### issue
`id` · `title` · `severity` · `category_id` · `metric` · `breached_value` · `threshold_id` ·
`scope_type`/`scope_id` · `status` (open/ack/resolved) · `first_seen` · `last_seen` · `count`.

### issue_affected_call
`issue_id` · `call_id` · `timestamp`.

---

## 5. Flagging (doc 10)
### call_flag
`id` · `call_id` · `flagged_by` · `source` (manual/auto) · `category_id?` · `severity?` ·
`status` (open/in_review/resolved/dismissed) · `created_at` · `resolved_by?` · `resolved_at?` ·
`eval_result_id?` (when auto).
### call_flag_comment
`id` · `flag_id` · `author` · `body` · `created_at`.

---

## 6. Fallbacks (doc 08)
### fallback_config
`id` · `service` (stt/tts/llm) · `scope_type`/`scope_id` · `primary_model` ·
`fallback_model?` (stt/tts) · `ordered_models` (jsonb, llm) · `enabled` · `updated_by` · `updated_at`.
### fallback_event
`id` · `timestamp` · `service` · `scope` · `call_id?` · `from_model` · `to_model` · `reason`.

---

## 6b. Invoicing (doc 21)
### invoice_config
`id` · `scope_type` (`org`|`project`) · `scope_id` · `recipients` (text[]) · `frequency`
(`weekly`|`biweekly`|`monthly`|`custom_days`) · `frequency_days?` · `timezone` (IANA) ·
`email_subject` · `email_body` · `columns` (jsonb, subset of the 6 in doc 21 §2) ·
`exclude_caller_ids` (text[]) · `exclude_call_ids` (text[]) · `active` · `created_at` · `updated_at` ·
`last_sent_at?`.
### invoice_downtime_exclusion
`id` · `scope_type`/`scope_id` · `from` · `to` · `reason` · `created_by` · `created_at`. A call whose
`start_time` falls inside is dropped from the run and its minutes total.
### invoice_run
`id` · `config_id` (fk) · `scope_type`/`scope_id` · `period_from` · `period_to` · `timezone` ·
`recipients` (text[] snapshot) · `call_count` · `total_minutes` · `excluded_test_calls` ·
`excluded_downtime_calls` · `status` (`sent`|`simulated`|`failed`) · `sent_at` · `triggered_by`.
No blob stored — CSV is regenerated on demand from `period_from`/`period_to` + the config.

---

## 7. Auth
### app_user
`id` · `email` · `role` (`superadmin`|`pm`|`dev`|`financial`) · `created_at`. SuperAdmin rows carry
no grants (implicit unrestricted access); `pm`/`dev`/`financial` rows are provisioned via Access
Management (doc 20) and must have ≥1 `access_grant` row to see any data.
### access_grant
`id` · `app_user_id` (fk) · `scope_type` (`org`|`project`) · `scope_id` (uuid) · `created_at`. Same
scoping/inheritance shape as `IpRule` (doc 16) — an org-level grant covers all its projects.

Policy module derives module visibility (doc 01 §3); scope helpers derive effective org/project ids
from `access_grant` rows (doc 01 §6, doc 20 §4). RLS-ready: scope by `org_id` / `project_id` joined
through `access_grant`.

---

## 8. Phase 2 — QA Bench
`evaluator`, `eval_schedule`, `eval_run`, `eval_result`, `eval_threshold` (doc 11 §6).

---

## 9. Notes
- Derived tables (`call_cost`, `period_rollup`) are computed by the shared cost functions (doc 03 §8);
  in the demo they're generated at seed time, in prod by ETL — same code.
- Keep external string ids (`call_id`, `session_id`, `host_id`) alongside uuids to match real data.
- All scoping columns (`org_id`, `project_id`) present everywhere for clean RLS + future Org-Admin tier.
