import { NextRequest, NextResponse } from "next/server";
import { getTelephonySource } from "@/lib/telephony-source";

export async function GET(req: NextRequest, ctx: { params: Promise<{ callId: string }> }) {
  const { callId } = await ctx.params;
  const format = req.nextUrl.searchParams.get("format") === "pcap" ? "pcap" : "text";
  const source = getTelephonySource();

  // Audit: every export is logged (who/when/format) — see PRD/19 §5.5.
  console.info(`[telephony:export] call=${callId} format=${format} at=${new Date().toISOString()}`);

  if (format === "pcap") {
    const bytes = await source.exportPcap(callId);
    if (!bytes) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/vnd.tcpdump.pcap",
        "Content-Disposition": `attachment; filename="${callId}.pcap"`,
      },
    });
  }

  const text = await source.exportText(callId);
  if (text === null) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${callId}.txt"`,
    },
  });
}
