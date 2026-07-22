import { NextRequest, NextResponse } from "next/server";
import { getTelephonySource } from "@/lib/telephony-source";
import { scopeFromSearch } from "@/lib/scope";
import type { SipMessageFilter } from "@/lib/telephony-source";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const scope = scopeFromSearch(sp);
  const filter: SipMessageFilter = {
    sessionId: sp.get("sessionId") || undefined,
    caller: sp.get("caller") || undefined,
    callee: sp.get("callee") || undefined,
    method: sp.get("method") || undefined,
    responseCode: sp.get("responseCode") || undefined,
    srcIp: sp.get("srcIp") || undefined,
    dstIp: sp.get("dstIp") || undefined,
    userAgent: sp.get("userAgent") || undefined,
    node: sp.get("node") || undefined,
  };
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") ?? "50")));
  const data = await getTelephonySource().listSipMessages(scope, filter, page, pageSize);
  return NextResponse.json(data);
}
