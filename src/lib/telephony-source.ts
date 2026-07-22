/**
 * TelephonySource selector — swaps the Telephony Observability module's data source independently
 * of the rest of the app's DATA_SOURCE (mock|supabase). Set TELEPHONY_DATA_SOURCE=homer + configure
 * HOMER_BASE_URL/HOMER_AUTH_TOKEN to read from a real Homer capture server; defaults to (and falls
 * back to) the mock generator otherwise. See PRD/19 §2.1, §7.
 */
import type { SipCallDetail } from "@/lib/types";
import type { Scope, SipCallFilter, SipCallPage } from "@/lib/data/source";
import { getDataSource } from "@/lib/data";
import { buildPcapBytes, buildTextExport } from "@/lib/telephony";
import { isHomerConfigured } from "@/lib/homer/client";
import { HomerTelephonySource } from "@/lib/homer/adapter";

export interface TelephonySource {
  listSipCalls(scope: Scope, filter: SipCallFilter, page: number, pageSize: number): Promise<SipCallPage>;
  getSipCallDetail(callId: string): Promise<SipCallDetail | null>;
  exportPcap(callId: string): Promise<Uint8Array | null>;
  exportText(callId: string): Promise<string | null>;
}

class MockTelephonySource implements TelephonySource {
  listSipCalls(scope: Scope, filter: SipCallFilter, page: number, pageSize: number) {
    return getDataSource().listSipCalls(scope, filter, page, pageSize);
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
