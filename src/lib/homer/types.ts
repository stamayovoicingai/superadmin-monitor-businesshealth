/**
 * Minimal typed subset of the Homer Next-Gen (v4) OpenAPI schemas this integration consumes.
 * Fields marked "best-effort" aren't formally specified in the draft spec we integrated against
 * (`homer-core` 4.0.2-draft) — they're read defensively (optional, unioned with `unknown`) so a
 * missing/renamed field degrades gracefully instead of throwing. See PRD/19 §8 open questions.
 */

export interface HomerCallElement {
  id?: number;
  sid: string; // Call-ID
  method?: string;
  method_text?: string;
  src_ip?: string;
  src_port?: number;
  dst_ip?: string;
  dst_port?: number;
  protocol?: number;
  create_date?: number;
  micro_ts?: number;
  alias_src?: string;
  alias_dst?: string;
  ruri_user?: string;
}

export interface HomerCallListResponse {
  data: { items: HomerCallElement[]; keys?: string[] };
  meta?: { pagination?: { total?: number; limit?: number; has_more?: boolean; next_cursor?: string } };
}

export interface HomerDataHeader {
  call_id?: string;
  from_user?: string;
  to_user?: string;
  from_tag?: string;
  to_tag?: string;
  method?: string;
  ruri_user?: string;
  ruri_domain?: string;
  auth_user?: string;
  pid_user?: string;
  user_agent?: string;
}

export interface HomerProtocolHeader {
  capture_id?: number;
  src_ip?: string;
  src_port?: number;
  dst_ip?: string;
  dst_port?: number;
  protocol?: number; // best-effort: treated as IP protocol (6=TCP, else UDP)
  protocol_family?: number;
  payload_type?: number;
  time_seconds?: number;
  time_useconds?: number;
}

export interface HomerMessage {
  id?: number;
  sid: string;
  data_header?: HomerDataHeader;
  protocol_header?: HomerProtocolHeader;
  raw: string;
}

export interface HomerMessageListResponse {
  data: { items: HomerMessage[] };
}

/**
 * Response shape of POST /transactions/callinfo — described in the spec's
 * TransactionSessionRequest doc comment ("ringing_seconds, call_duration_seconds, codecs,
 * UAC/UAS, setup delays, status, from_party, ruri_party, methods_distribution"), not present as a
 * formal schema in the paths we received. Treated as best-effort/optional throughout — this
 * endpoint is an enrichment, never a hard dependency (PRD/19 §8).
 */
export interface HomerCallInfo {
  session_id?: string;
  from_party?: string;
  ruri_party?: string;
  status?: string | number;
  call_duration_seconds?: number;
  ringing_seconds?: number;
  codecs?: string[] | string;
  [key: string]: unknown;
}

export interface HomerCallInfoListResponse {
  data: { items: HomerCallInfo[] };
}

/** RTP/RTCP row — best-effort field extraction, see HomerCallInfo doc comment. */
export interface HomerQosItem {
  id?: number;
  sid?: string;
  micro_ts?: number;
  src_ip?: string;
  src_port?: number;
  dst_ip?: string;
  dst_port?: number;
  payload_type?: number;
  [key: string]: unknown;
}

export interface HomerQosResponse {
  data: {
    rtp?: { data: HomerQosItem[] };
    rtcp?: { data: HomerQosItem[] };
  };
}

export interface HomerExportCreateResponse {
  data: { export_id: string; status: string };
}

export interface HomerExportStatusResponse {
  data: { export_id: string; status: string; download_url?: string };
}
