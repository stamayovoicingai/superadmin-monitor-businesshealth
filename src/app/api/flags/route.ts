import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { FlagStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().listFlags({
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { callId?: string; comment?: string };
  if (!body.callId) return NextResponse.json({ error: "missing_call" }, { status: 400 });
  const flag = await getDataSource().createFlag({ callId: body.callId, comment: body.comment ?? "" });
  return NextResponse.json(flag, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { id?: string; status?: FlagStatus; comment?: string };
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const ds = getDataSource();
  if (body.status) await ds.updateFlagStatus(body.id, body.status);
  if (body.comment) await ds.addFlagComment(body.id, body.comment);
  return NextResponse.json({ ok: true });
}
