import { NextRequest, NextResponse } from "next/server";
import { getTelephonySource } from "@/lib/telephony-source";
import { scopeFromSearch } from "@/lib/scope";
import type { SipCallFilter } from "@/lib/data/source";
import type { SipCallStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const scope = scopeFromSearch(sp);
  const filter: SipCallFilter = {
    origin: sp.get("origin") || undefined,
    destination: sp.get("destination") || undefined,
    sipCallId: sp.get("sipCallId") || undefined,
    status: (sp.get("status") as SipCallStatus) || undefined,
  };
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? "25")));
  const data = await getTelephonySource().listSipCalls(scope, filter, page, pageSize);
  return NextResponse.json(data);
}
