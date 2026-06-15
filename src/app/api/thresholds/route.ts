import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { CreateThresholdInput, UpdateThresholdPatch } from "@/lib/data/source";

export async function GET() {
  const ds = getDataSource();
  const [thresholds, categories] = await Promise.all([ds.listThresholds(), ds.listIssueCategories()]);
  return NextResponse.json({ thresholds, categories });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateThresholdInput;
  if (!body.metric || !body.scopeType || !body.categoryId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const t = await getDataSource().createThreshold(body);
  return NextResponse.json(t, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as UpdateThresholdPatch;
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await getDataSource().updateThreshold(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await getDataSource().deleteThreshold(id);
  return NextResponse.json({ ok: true });
}
