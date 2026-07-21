import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().previewInvoice(
    { orgId: sp.get("orgId") || undefined, projectId: sp.get("projectId") || undefined },
    sp.get("from") || undefined,
    sp.get("to") || undefined,
  );
  if (!data) return NextResponse.json({ error: "no_config_for_scope" }, { status: 404 });
  return NextResponse.json(data);
}
