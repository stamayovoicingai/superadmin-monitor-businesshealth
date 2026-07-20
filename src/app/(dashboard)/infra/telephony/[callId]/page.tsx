"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Download, FileText, PhoneOutgoing } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SipStatusChip } from "@/components/chips";
import { SipFlowLadder } from "@/components/sip-flow-ladder";
import { MultiLineChart } from "@/components/charts";
import { useTelephonyCall } from "@/lib/hooks";
import { formatNumber } from "@/lib/money";
import type { SipMessage } from "@/lib/types";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MessageInspector({ m }: { m: SipMessage }) {
  return (
    <Tabs defaultValue="message">
      <TabsList>
        <TabsTrigger value="message">Message</TabsTrigger>
        <TabsTrigger value="sip">SIP</TabsTrigger>
        <TabsTrigger value="sdp">SDP</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="message">
        <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">{m.raw}</pre>
      </TabsContent>
      <TabsContent value="sip">
        <div className="space-y-1 rounded-md border p-3 text-xs">
          {Object.entries(m.headers).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[120px_1fr] gap-2">
              <span className="font-mono font-semibold text-muted-foreground">{k}</span>
              <span className="font-mono break-all">{v}</span>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="sdp">
        {m.sdp ? (
          <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">{m.sdp}</pre>
        ) : (
          <p className="p-2 text-sm text-muted-foreground">This message has no SDP body.</p>
        )}
      </TabsContent>
      <TabsContent value="details">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">Source → Destination:</span> <span className="font-mono">{m.src} → {m.dst}</span></div>
          <div><span className="text-muted-foreground">Transport:</span> {m.transport}</div>
          <div><span className="text-muted-foreground">Size:</span> {m.sizeBytes} bytes</div>
          <div><span className="text-muted-foreground">Delta:</span> +{m.deltaMs}ms</div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function TelephonyCallDetailPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const { data, isLoading } = useTelephonyCall(params.callId);
  const [expanded, setExpanded] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        SIP call not found.
        <div className="mt-3">
          <Button variant="outline" onClick={() => router.push("/infra/telephony")}>Back to communications</Button>
        </div>
      </div>
    );
  }

  const { summary, linkedCall, messages, quality, qualityVerdict } = data;

  const qualityByTs = new Map<string, { t: string; callerJitterMs?: number; calleeJitterMs?: number; callerLossPct?: number; calleeLossPct?: number }>();
  for (const q of quality) {
    const row = qualityByTs.get(q.ts) ?? { t: q.ts };
    if (q.direction === "caller") {
      row.callerJitterMs = q.jitterMs;
      row.callerLossPct = q.packetLossPct;
    } else {
      row.calleeJitterMs = q.jitterMs;
      row.calleeLossPct = q.packetLossPct;
    }
    qualityByTs.set(q.ts, row);
  }
  const qualitySeries = Array.from(qualityByTs.values()).sort((a, b) => a.t.localeCompare(b.t));
  const avgMos = quality.length ? (quality.reduce((s, q) => s + q.mos, 0) / quality.length).toFixed(2) : "—";

  const verdictColor = qualityVerdict === "fail" ? "text-critical" : qualityVerdict === "warn" ? "text-warning" : "text-success";
  const verdictLabel = qualityVerdict === "fail" ? "Out of threshold" : qualityVerdict === "warn" ? "Degraded" : "Good";

  return (
    <div>
      <PageHeader
        title={summary.sipCallId}
        description={linkedCall ? `${linkedCall.projectName} · ${linkedCall.orgName}` : "No correlation with an app call_id"}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => router.push("/infra/telephony")}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {linkedCall && (
              <Button variant="outline" size="sm" render={<Link href={`/calls/${linkedCall.callId}`} />}>
                <PhoneOutgoing className="size-4" /> View app call
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SipStatusChip status={summary.status} />
        {summary.finalStatusCode && <Badge variant="outline" className="font-mono">{summary.finalStatusCode} {summary.finalReason}</Badge>}
        <Badge variant="outline">{summary.direction === "inbound" ? "Inbound" : "Outbound"}</Badge>
        <Badge variant="outline">{new Date(summary.startTime).toLocaleString()}</Badge>
        <Badge variant="outline">{fmtDuration(summary.durationSecs)}</Badge>
        {summary.retransmissions > 0 && <Badge className="bg-warning/10 text-warning">{summary.retransmissions} retransmissions</Badge>}
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="flow">Flow</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Call details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Origin (ANI)" value={<span className="font-mono">{summary.origin}</span>} />
                <Row label="Destination (DNIS)" value={<span className="font-mono">{summary.destination}</span>} />
                <Row label="Direction" value={summary.direction === "inbound" ? "Inbound" : "Outbound"} />
                <Row label="Start" value={new Date(summary.startTime).toLocaleString()} />
                <Row label="End" value={summary.endTime ? new Date(summary.endTime).toLocaleString() : "In progress"} />
                <Row label="Duration" value={fmtDuration(summary.durationSecs)} />
                <Row label="Negotiated codec" value={summary.codec} />
                <Row label="Retransmissions" value={String(summary.retransmissions)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Trunk / hops</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {summary.trunkHops.map((h, i) => (
                    <React.Fragment key={h}>
                      <Badge variant="secondary">{h}</Badge>
                      {i < summary.trunkHops.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
                    </React.Fragment>
                  ))}
                </div>
                <Row label="Call-ID (SIP)" value={<span className="break-all font-mono text-xs">{summary.sipCallId}</span>} />
                {linkedCall ? (
                  <Row
                    label="Linked call (app)"
                    value={
                      <Link href={`/calls/${linkedCall.callId}`} className="font-mono text-primary hover:underline">
                        {linkedCall.callId}
                      </Link>
                    }
                  />
                ) : (
                  <Row label="Linked call (app)" value="—" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <CardTitle>Call flow</CardTitle>
              <CardDescription>{messages.length} messages in this session</CardDescription>
            </CardHeader>
            <CardContent>
              <SipFlowLadder messages={messages} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>#</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead>Source → Destination</TableHead>
                    <TableHead>Proto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m) => (
                    <React.Fragment key={m.seq}>
                      <TableRow className="cursor-pointer" onClick={() => setExpanded(expanded === m.seq ? null : m.seq)}>
                        <TableCell>{expanded === m.seq ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{m.seq}</TableCell>
                        <TableCell className="font-mono text-xs">{new Date(m.ts).toLocaleTimeString()}.{String(new Date(m.ts).getMilliseconds()).padStart(3, "0")}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">+{m.deltaMs}ms</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono">{m.method}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{(m.sizeBytes / 1024).toFixed(1)} KB</TableCell>
                        <TableCell className="font-mono text-xs">{m.src} → {m.dst}</TableCell>
                        <TableCell className="text-muted-foreground">{m.transport}</TableCell>
                      </TableRow>
                      {expanded === m.seq && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/30 p-3">
                            <MessageInspector m={m} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          {quality.length === 0 ? (
            <p className="text-sm text-muted-foreground">No RTP/RTCP samples (the call never established media).</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Avg MOS</div><div className="font-display text-2xl">{avgMos}</div></CardContent></Card>
                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Codec</div><div className="font-display text-2xl">{summary.codec}</div></CardContent></Card>
                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Verdict</div><div className={`font-display text-2xl ${verdictColor}`}>{verdictLabel}</div></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Jitter (ms)</CardTitle></CardHeader>
                <CardContent>
                  <MultiLineChart
                    data={qualitySeries}
                    keys={[
                      { key: "callerJitterMs", label: "Caller", color: "var(--chart-1)" },
                      { key: "calleeJitterMs", label: "Callee", color: "var(--chart-2)" },
                    ]}
                    unit="ms"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Packet loss (%)</CardTitle></CardHeader>
                <CardContent>
                  <MultiLineChart
                    data={qualitySeries}
                    keys={[
                      { key: "callerLossPct", label: "Caller", color: "var(--chart-3)" },
                      { key: "calleeLossPct", label: "Callee", color: "var(--chart-4)" },
                    ]}
                    unit="%"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="export">
          <p className="mb-3 text-sm text-muted-foreground">Export this call&apos;s data in different formats.</p>
          <div className="space-y-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <Download className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">PCAP capture</div>
                  <div className="text-xs text-muted-foreground">Packet capture file compatible with Wireshark</div>
                </div>
                <Button variant="outline" size="sm" render={<a href={`/api/infra/telephony/${params.callId}/export?format=pcap`} download />}>
                  <Download className="size-4" /> Download
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Plain text</div>
                  <div className="text-xs text-muted-foreground">SIP messages exported as human-readable text</div>
                </div>
                <Button variant="outline" size="sm" render={<a href={`/api/infra/telephony/${params.callId}/export?format=text`} download />}>
                  <Download className="size-4" /> Download
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-3 text-right text-xs text-muted-foreground">{formatNumber(messages.length)} messages captured</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
