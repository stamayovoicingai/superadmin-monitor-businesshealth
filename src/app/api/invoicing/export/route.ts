import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result = await getDataSource().exportInvoiceCsv(
    { orgId: sp.get("orgId") || undefined, projectId: sp.get("projectId") || undefined },
    sp.get("from") || undefined,
    sp.get("to") || undefined,
  );
  if (!result) return NextResponse.json({ error: "no_config_for_scope" }, { status: 404 });

  console.info(`[invoicing:export] file=${result.filename} at=${new Date().toISOString()}`);

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
