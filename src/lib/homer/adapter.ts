/**
 * HomerTelephonySource — real HEP capture data via the Homer Next-Gen (v4) REST API, mapped onto
 * the platform's SipMessageRow (list) / SipCallDetail (Transaction view) shapes (PRD/19).
 * Selected via TELEPHONY_DATA_SOURCE=homer (see lib/telephony-source.ts); the mock generator
 * (lib/telephony.ts) remains the default and the fallback when Homer isn't configured.
 *
 * Known gaps, tracked in PRD/19 §8 (not silently assumed away):
 * - No org/project attribution: Homer has no concept of Voicing orgs/projects, so
 *   `orgId`/`projectId`/`projectName`/`orgName` are empty/placeholder. The Communications list is
 *   effectively platform-wide in Homer mode until a real node↔project mapping exists.
 * - No confirmed cross-reference to the app-level `Call` — `linkedCall` is always null. Wiring
 *   this needs the telephony layer (Asterisk/LiveKit) to record the real SIP Call-ID on our side.
 * - List-row `caller` is best-effort ("—" unless resolvable): the documented `GET/POST
 *   /transactions*` response (`CallElement`) doesn't carry `from_user`, only `ruri_user`
 *   (destination) — Homer's own Results Table clearly joins more columns than this generic schema
 *   documents. Filtering by caller still works (`filter.from_user` is accepted), display doesn't.
 * - `/transactions/callinfo` and the QoS row fields (jitter/loss/MOS) are read defensively against
 *   a draft/undocumented shape — verify field names against the real server and adjust extraction.
 */
import type {
  SipCallDetail,
  SipCallStatus,
  SipMessage,
  SipMessageRow,
  SipQualitySample,
} from "@/lib/types";
import type { Scope } from "@/lib/data/source";
import { extractSdpBody, parseSipHeaders, qualityVerdict } from "@/lib/telephony";
import { homer, homerGetBinary, sleep } from "./client";
import type {
  HomerAliasListResponse,
  HomerCallElement,
  HomerCallInfo,
  HomerCallInfoListResponse,
  HomerCallListResponse,
  HomerExportCreateResponse,
  HomerExportStatusResponse,
  HomerMessage,
  HomerMessageListResponse,
  HomerMessageResponse,
  HomerQosResponse,
} from "./types";
import type { SipMessageFilter, SipMessagePage, SipMessagePayload, TelephonySource } from "../telephony-source";

function numberish(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

/** First line "INVITE sip:..." → "INVITE"; "SIP/2.0 486 Busy Here" → "486". */
function extractMethodOrCode(raw: string): string | null {
  const firstLine = raw.replace(/\r\n/g, "\n").split("\n")[0]?.trim() ?? "";
  const statusMatch = firstLine.match(/^SIP\/2\.0\s+(\d{3})/);
  if (statusMatch) return statusMatch[1];
  const reqMatch = firstLine.match(/^([A-Z]+)\s+sip:/i);
  return reqMatch ? reqMatch[1].toUpperCase() : null;
}

/** `"Display Name" <sip:12065551234@domain>` → `12065551234`. */
function extractUser(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const m = headerValue.match(/sip:([^@;>]+)/i);
  return m ? m[1] : null;
}

function extractCodecFromSdp(sdp: string | null): string {
  if (!sdp) return "";
  const m = sdp.match(/a=rtpmap:\d+\s+([\w-]+\/\d+)/i);
  return m ? m[1] : "";
}

function countRetransmissions(messages: SipMessage[]): number {
  const seen = new Set<string>();
  let dupes = 0;
  for (const m of messages) {
    const key = `${m.method}:${m.headers["CSeq"] ?? ""}:${m.src}`;
    if (seen.has(key)) dupes++;
    else seen.add(key);
  }
  return dupes;
}

export class HomerTelephonySource implements TelephonySource {
  private aliasCache: Map<string, string> | null = null;

  async listSipMessages(scope: Scope, filter: SipMessageFilter, page: number, pageSize: number): Promise<SipMessagePage> {
    const from = scope.from ? new Date(scope.from).getTime() : Date.now() - 24 * 3600_000;
    const to = scope.to ? new Date(scope.to).getTime() : Date.now();

    const searchFilter: Record<string, unknown> = {};
    if (filter.sessionId) searchFilter.call_id = filter.sessionId;
    if (filter.caller) searchFilter.from_user = filter.caller;
    if (filter.callee) searchFilter.ruri_user = filter.callee;
    if (filter.method) searchFilter.method = filter.method;
    if (filter.srcIp) searchFilter.src_ip = filter.srcIp;
    if (filter.dstIp) searchFilter.dst_ip = filter.dstIp;
    if (filter.userAgent) searchFilter.user_agent = filter.userAgent;
    if (filter.node) searchFilter.node = filter.node;

    // Homer's advanced search is cursor-paginated; we approximate numeric "page" by fetching
    // page*pageSize items (capped at Homer's max) and slicing — correct for shallow pagination,
    // a known limitation for deep pages (PRD/19 §8).
    const limit = Math.min(1000, page * pageSize);
    const res = await homer.post<HomerCallListResponse>("/transactions/search", {
      timestamp: { from, to },
      filter: searchFilter,
      param: { limit },
    });

    const items = res.data?.items ?? [];
    const sliceStart = (page - 1) * pageSize;
    const pageItems = items.slice(sliceStart, sliceStart + pageSize);
    const aliasMap = await this.getAliasMap();

    let rows = pageItems.map((item) => this.toMessageRow(item, aliasMap));
    if (filter.responseCode) rows = rows.filter((r) => r.method === filter.responseCode);

    return { rows, total: res.meta?.pagination?.total ?? items.length, page, pageSize };
  }

  async getSipMessagePayload(uuid: string): Promise<SipMessagePayload | null> {
    try {
      const res = await homer.get<HomerMessageResponse>(`/messages/${encodeURIComponent(uuid)}`);
      const m = res.data;
      if (!m) return null;
      const sipMsg = this.toSipMessage(m, 0);
      const [srcIp, srcPortStr] = sipMsg.src.split(":");
      const [dstIp, dstPortStr] = sipMsg.dst.split(":");
      return {
        uuid,
        sessionId: m.sid,
        cid: m.sid,
        timestamp: sipMsg.ts,
        method: sipMsg.method,
        srcIp,
        srcPort: Number(srcPortStr ?? 0),
        dstIp,
        dstPort: Number(dstPortStr ?? 0),
        raw: sipMsg.raw,
        headers: sipMsg.headers,
        sdp: sipMsg.sdp,
      };
    } catch {
      return null;
    }
  }

  async getSipCallDetail(callId: string): Promise<SipCallDetail | null> {
    const msgRes = await homer.post<HomerMessageListResponse>("/transactions/messages", {
      session_id: callId,
      proto_type: 1,
      event_type: "call",
    });
    const homerMessages = msgRes.data?.items ?? [];
    if (homerMessages.length === 0) return null;

    const t0Ms = Date.now();
    const rawSorted = homerMessages
      .map((m, i) => this.toSipMessage(m, i))
      .sort((a, b) => a.ts.localeCompare(b.ts));
    const t0 = rawSorted.length ? new Date(rawSorted[0].ts).getTime() : t0Ms;
    const messages: SipMessage[] = rawSorted.map((m, i) => ({ ...m, seq: i + 1, deltaMs: new Date(m.ts).getTime() - t0 }));

    const info = (await this.fetchCallInfo([callId], t0 - 3600_000, Date.now())).get(callId) ?? null;
    const summary = this.buildSummaryFromMessages(callId, messages, info);
    const quality = await this.fetchQuality(callId);

    return {
      summary,
      linkedCall: null, // no confirmed app-Call cross-reference yet — see module doc comment
      messages,
      quality,
      qualityVerdict: qualityVerdict(quality),
    };
  }

  async exportPcap(callId: string): Promise<Uint8Array | null> {
    const bytes = await this.runExport(callId, "pcap");
    return bytes ? new Uint8Array(bytes) : null;
  }

  async exportText(callId: string): Promise<string | null> {
    const bytes = await this.runExport(callId, "text");
    return bytes ? new TextDecoder().decode(bytes) : null;
  }

  /* ---- internals ---- */

  private async getAliasMap(): Promise<Map<string, string>> {
    if (this.aliasCache) return this.aliasCache;
    const map = new Map<string, string>();
    try {
      const res = await homer.get<HomerAliasListResponse>("/aliases?page[limit]=1000");
      for (const a of res.data?.items ?? []) {
        if (a.ip && a.alias) map.set(a.ip, a.alias);
      }
    } catch {
      // Alias resolution is cosmetic (raw IPs still work) — never block the list on it.
    }
    this.aliasCache = map;
    return map;
  }

  private toMessageRow(item: HomerCallElement, aliasMap: Map<string, string>): SipMessageRow {
    const startMs = item.micro_ts ? Math.floor(item.micro_ts / 1000) : (item.create_date ?? Date.now());
    return {
      uuid: String(item.id ?? item.sid),
      sessionId: item.sid,
      cid: item.sid,
      timestamp: new Date(startMs).toISOString(),
      method: item.method || item.method_text || "—",
      cseqMethod: item.method || item.method_text || "—",
      caller: "—", // see module doc comment — not available on the documented list-row shape
      callee: item.ruri_user ?? "—",
      srcIp: item.src_ip ?? "—",
      srcPort: item.src_port ?? 0,
      dstIp: item.dst_ip ?? "—",
      dstPort: item.dst_port ?? 0,
      srcAlias: item.src_ip ? (aliasMap.get(item.src_ip) ?? item.alias_src ?? null) : (item.alias_src ?? null),
      dstAlias: item.dst_ip ? (aliasMap.get(item.dst_ip) ?? item.alias_dst ?? null) : (item.alias_dst ?? null),
      transport: item.protocol === 6 ? "TCP" : "UDP",
    };
  }

  private toSipMessage(m: HomerMessage, index: number): SipMessage {
    const ph = m.protocol_header;
    const tsMs = ph?.time_seconds ? ph.time_seconds * 1000 + Math.floor((ph.time_useconds ?? 0) / 1000) : Date.now();
    const raw = m.raw ?? "";
    const method = extractMethodOrCode(raw) ?? m.data_header?.method ?? "UNKNOWN";
    return {
      uuid: m.id != null ? String(m.id) : `${m.sid}::${index + 1}`,
      seq: index + 1,
      ts: new Date(tsMs).toISOString(),
      deltaMs: 0,
      method,
      sizeBytes: new TextEncoder().encode(raw).length,
      src: ph?.src_ip ? `${ph.src_ip}:${ph.src_port ?? 0}` : "—",
      dst: ph?.dst_ip ? `${ph.dst_ip}:${ph.dst_port ?? 0}` : "—",
      transport: ph?.protocol === 6 ? "TCP" : "UDP",
      raw,
      headers: parseSipHeaders(raw),
      sdp: extractSdpBody(raw),
    };
  }

  private buildSummaryFromMessages(sid: string, messages: SipMessage[], info: HomerCallInfo | null) {
    const first = messages[0];
    const last = messages[messages.length - 1];
    const finalMsg = [...messages].reverse().find((m) => /^\d{3}$/.test(m.method));
    const finalCode = finalMsg ? Number(finalMsg.method) : null;
    const hasBye = messages.some((m) => m.method === "BYE");
    const hasCancel = messages.some((m) => m.method === "CANCEL");

    let status: SipCallStatus;
    if (finalCode === null) status = "activa";
    else if (finalCode >= 400) status = hasCancel ? "no_contesto" : "fallida";
    else if (finalCode >= 200 && hasBye) status = "finalizada";
    else status = "activa";

    const durationSecs =
      hasBye && finalMsg ? Math.round((new Date(last.ts).getTime() - new Date(first.ts).getTime()) / 1000) : (numberish(info?.call_duration_seconds) ?? 0);

    const sdpMsg = messages.find((m) => m.sdp);

    return {
      id: `homer-${sid}`,
      sipCallId: sid,
      linkedCallId: null,
      orgId: "",
      projectId: "",
      direction: "inbound" as const,
      origin: info?.from_party ?? extractUser(first.headers["From"]) ?? "—",
      destination: info?.ruri_party ?? extractUser(first.headers["To"]) ?? "—",
      startTime: first.ts,
      endTime: hasBye ? last.ts : null,
      durationSecs,
      status,
      finalStatusCode: finalCode,
      finalReason: finalMsg ? (finalMsg.raw.replace(/\r\n/g, "\n").split("\n")[0] ?? null) : null,
      trunkHops: Array.from(new Set(messages.flatMap((m) => [m.src.split(":")[0], m.dst.split(":")[0]]))),
      methodsSequence: messages.map((m) => m.method),
      retransmissions: countRetransmissions(messages),
      codec: extractCodecFromSdp(sdpMsg?.sdp ?? null),
    };
  }

  private async fetchCallInfo(sids: string[], from: number, to: number): Promise<Map<string, HomerCallInfo>> {
    const ids = sids.filter(Boolean).slice(0, 50);
    if (ids.length === 0) return new Map();
    try {
      const res = await homer.post<HomerCallInfoListResponse>("/transactions/callinfo", {
        session_ids: ids,
        proto_type: 1,
        event_type: "call",
        timestamp: { from, to },
      });
      const map = new Map<string, HomerCallInfo>();
      for (const item of res.data?.items ?? []) {
        const sid = item.session_id ?? (item as { sid?: string }).sid;
        if (sid) map.set(sid, item);
      }
      return map;
    } catch {
      // callinfo is an enrichment (richer status/duration/codec), never a hard dependency — degrade gracefully.
      return new Map();
    }
  }

  private async fetchQuality(sid: string): Promise<SipQualitySample[]> {
    try {
      const res = await homer.post<HomerQosResponse>("/transactions/qos", { session_id: sid, proto_type: 1, event_type: "call" });
      const rows = [...(res.data?.rtcp?.data ?? []), ...(res.data?.rtp?.data ?? [])];
      const samples: SipQualitySample[] = [];
      for (const item of rows) {
        const jitter = numberish(item.jitter ?? item.jitter_ms);
        const loss = numberish(item.packet_loss ?? item.packet_loss_pct ?? item.fraction_lost);
        const mos = numberish(item.mos ?? item.mos_lq ?? item.mos_cq);
        const rtt = numberish(item.rtt ?? item.rtt_ms);
        if (jitter == null && loss == null && mos == null) continue; // row has no usable quality fields
        samples.push({
          ts: item.micro_ts ? new Date(Math.floor(item.micro_ts / 1000)).toISOString() : new Date().toISOString(),
          direction: "caller",
          jitterMs: jitter ?? 0,
          packetLossPct: loss ?? 0,
          mos: mos ?? 0,
          rttMs: rtt ?? 0,
          codec: "",
        });
      }
      return samples.sort((a, b) => a.ts.localeCompare(b.ts));
    } catch {
      return [];
    }
  }

  private async runExport(callId: string, type: "pcap" | "text"): Promise<ArrayBuffer | null> {
    const create = await homer.post<HomerExportCreateResponse>("/exports", {
      type,
      query: { session_id: callId, proto_type: 1, event_type: "call" },
    });
    const exportId = create.data?.export_id;
    if (!exportId) return null;

    const deadline = Date.now() + 15_000;
    let downloadUrl: string | undefined;
    while (Date.now() < deadline) {
      const status = await homer.get<HomerExportStatusResponse>(`/exports/${exportId}`);
      if (status.data?.download_url) {
        downloadUrl = status.data.download_url;
        break;
      }
      if (status.data?.status === "failed" || status.data?.status === "error") return null;
      await sleep(750);
    }
    if (!downloadUrl) return null;
    return homerGetBinary(downloadUrl.startsWith("http") ? downloadUrl : `/exports/${exportId}/download`);
  }
}
