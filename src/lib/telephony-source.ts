/**
 * TelephonySource selector — swaps the Telephony Observability module's data source independently
 * of the rest of the app's DATA_SOURCE (mock|supabase). Set TELEPHONY_DATA_SOURCE=homer + configure
 * HOMER_BASE_URL/HOMER_AUTH_TOKEN to read from a real Homer capture server; defaults to (and falls
 * back to) the mock generator otherwise. See PRD/19 §2.1, §4, §7.
 *
 * The Communications list is message-level (one row per raw SIP message, PRD/19 §4 — mirrors
 * Homer's own "Results Table"), not call-level; the Transaction view (`getSipCallDetail`) is still
 * one full dialog per SIP Call-ID, unchanged from the original design.
 */
import type { SipCallDetail, SipMessageRow } from "@/lib/types";
import type { Scope } from "@/lib/data/source";
import { getDataSource } from "@/lib/data";
import { getDataset } from "@/lib/seed";
import { buildSipMessages, buildSipSummary, buildPcapBytes, buildTextExport } from "@/lib/telephony";
import { isHomerConfigured } from "@/lib/homer/client";
import { HomerTelephonySource } from "@/lib/homer/adapter";

export interface SipMessageFilter {
  sessionId?: string; // Call-ID / CID substring
  caller?: string;
  callee?: string;
  method?: string;
  responseCode?: string;
  srcIp?: string;
  dstIp?: string;
  userAgent?: string;
  node?: string;
}

export interface SipMessagePage {
  rows: SipMessageRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SipMessagePayload {
  uuid: string;
  sessionId: string;
  cid: string;
  timestamp: string;
  method: string;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  raw: string;
  headers: Record<string, string>;
  sdp: string | null;
}

export interface TelephonySource {
  listSipMessages(scope: Scope, filter: SipMessageFilter, page: number, pageSize: number): Promise<SipMessagePage>;
  getSipMessagePayload(uuid: string): Promise<SipMessagePayload | null>;
  getSipCallDetail(callId: string): Promise<SipCallDetail | null>;
  exportPcap(callId: string): Promise<Uint8Array | null>;
  exportText(callId: string): Promise<string | null>;
}

/** Calls whose full message set we materialize per list request — bounds cost regardless of dataset size. */
const MOCK_LIST_CALL_CAP = 80;

class MockTelephonySource implements TelephonySource {
  async listSipMessages(scope: Scope, filter: SipMessageFilter, page: number, pageSize: number): Promise<SipMessagePage> {
    const { calls, projects } = getDataset();
    const scoped = calls
      .filter(
        (c) =>
          (!scope.orgId || c.orgId === scope.orgId) &&
          (!scope.projectId || c.projectId === scope.projectId) &&
          (!scope.from || c.startTime >= scope.from) &&
          (!scope.to || c.startTime <= scope.to),
      )
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
      .slice(0, MOCK_LIST_CALL_CAP);

    let rows: SipMessageRow[] = [];
    for (const call of scoped) {
      const project = projects.find((p) => p.id === call.projectId);
      if (!project) continue;
      const summary = buildSipSummary(call, project);
      if (filter.sessionId && !summary.sipCallId.toLowerCase().includes(filter.sessionId.toLowerCase())) continue;
      if (filter.caller && !summary.origin.includes(filter.caller)) continue;
      if (filter.callee && !summary.destination.includes(filter.callee)) continue;

      const messages = buildSipMessages(call, summary);
      for (const m of messages) {
        const [srcIp, srcPortStr] = m.src.split(":");
        const [dstIp, dstPortStr] = m.dst.split(":");
        rows.push({
          uuid: `${call.id}::${m.seq}`,
          sessionId: summary.sipCallId,
          cid: summary.sipCallId,
          timestamp: m.ts,
          method: m.method,
          cseqMethod: m.headers["CSeq"]?.split(" ")[1] ?? m.method,
          caller: summary.origin,
          callee: summary.destination,
          srcIp,
          srcPort: Number(srcPortStr ?? 0),
          dstIp,
          dstPort: Number(dstPortStr ?? 0),
          srcAlias: null,
          dstAlias: null,
          transport: m.transport,
        });
      }
    }

    if (filter.method) rows = rows.filter((r) => r.method.toUpperCase() === filter.method!.toUpperCase());
    if (filter.responseCode) rows = rows.filter((r) => r.method === filter.responseCode);
    if (filter.srcIp) rows = rows.filter((r) => r.srcIp.includes(filter.srcIp!));
    if (filter.dstIp) rows = rows.filter((r) => r.dstIp.includes(filter.dstIp!));
    // caller/callee already applied at the call level above; userAgent/node aren't modeled per-row in
    // the mock generator (best-effort — real Homer mode supports both, see PRD/19 §8).

    rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), total, page, pageSize };
  }

  async getSipMessagePayload(uuid: string): Promise<SipMessagePayload | null> {
    const [callId, seqStr] = uuid.split("::");
    const seq = Number(seqStr);
    if (!callId || !Number.isFinite(seq)) return null;
    const { calls, projects } = getDataset();
    const call = calls.find((c) => c.id === callId);
    if (!call) return null;
    const project = projects.find((p) => p.id === call.projectId);
    if (!project) return null;
    const summary = buildSipSummary(call, project);
    const message = buildSipMessages(call, summary).find((m) => m.seq === seq);
    if (!message) return null;
    const [srcIp, srcPortStr] = message.src.split(":");
    const [dstIp, dstPortStr] = message.dst.split(":");
    return {
      uuid,
      sessionId: summary.sipCallId,
      cid: summary.sipCallId,
      timestamp: message.ts,
      method: message.method,
      srcIp,
      srcPort: Number(srcPortStr ?? 0),
      dstIp,
      dstPort: Number(dstPortStr ?? 0),
      raw: message.raw,
      headers: message.headers,
      sdp: message.sdp,
    };
  }

  getSipCallDetail(callId: string) {
    return getDataSource().getSipCallDetail(callId);
  }
  async exportPcap(callId: string) {
    const detail = await getDataSource().getSipCallDetail(callId);
    return detail ? buildPcapBytes(detail.messages) : null;
  }
  async exportText(callId: string) {
    const detail = await getDataSource().getSipCallDetail(callId);
    return detail ? buildTextExport(detail.summary, detail.messages) : null;
  }
}

let _source: TelephonySource | null = null;

export function getTelephonySource(): TelephonySource {
  if (_source) return _source;
  const kind = process.env.TELEPHONY_DATA_SOURCE ?? "mock";
  if (kind === "homer" && isHomerConfigured()) {
    _source = new HomerTelephonySource();
  } else {
    if (kind === "homer") console.warn("[telephony] TELEPHONY_DATA_SOURCE=homer but HOMER_BASE_URL/HOMER_AUTH_TOKEN is missing — falling back to mock");
    _source = new MockTelephonySource();
  }
  return _source;
}
