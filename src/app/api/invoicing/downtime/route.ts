import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { AddDowntimeExclusionInput } from "@/lib/data/source";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<AddDowntimeExclusionInput>;
  if (!body.scopeType || !body.scopeId || !body.from || !body.to) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (new Date(body.from) >= new Date(body.to)) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }
  const row = await getDataSource().addDowntimeExclusion({
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    from: body.from,
    to: body.to,
    reason: body.reason ?? "",
  });
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await getDataSource().deleteDowntimeExclusion(id);
  return NextResponse.json({ ok: true });
}
