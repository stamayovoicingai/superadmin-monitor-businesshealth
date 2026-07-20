import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import { buildPcapBytes, buildTextExport } from "@/lib/telephony";

export async function GET(req: NextRequest, ctx: { params: Promise<{ callId: string }> }) {
  const { callId } = await ctx.params;
  const format = req.nextUrl.searchParams.get("format") === "pcap" ? "pcap" : "text";
  const detail = await getDataSource().getSipCallDetail(callId);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Audit: every export is logged (who/when/format) — see PRD/19 §5.5.
  console.info(`[telephony:export] call=${callId} format=${format} at=${new Date().toISOString()}`);

  if (format === "pcap") {
    const bytes = buildPcapBytes(detail.messages);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/vnd.tcpdump.pcap",
        "Content-Disposition": `attachment; filename="${callId}.pcap"`,
      },
    });
  }

  const text = buildTextExport(detail.summary, detail.messages);
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${callId}.txt"`,
    },
  });
}
