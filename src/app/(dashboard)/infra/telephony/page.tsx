"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SipStatusChip } from "@/components/chips";
import { useTelephonyCalls } from "@/lib/hooks";
import { formatNumber } from "@/lib/money";
import type { SipCallStatus } from "@/lib/types";

const ANY = "__any__";
const PAGE_SIZE = 25;

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MethodChips({ methods }: { methods: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((m, i) => (
        <Badge key={i} variant="outline" className="px-1.5 font-mono text-[10px]">
          {m}
        </Badge>
      ))}
    </div>
  );
}

export default function TelephonyPage() {
  const [page, setPage] = React.useState(1);
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [sipCallId, setSipCallId] = React.useState("");
  const [status, setStatus] = React.useState<SipCallStatus>();
  const [live, setLive] = React.useState(false);
  const [debounced, setDebounced] = React.useState({ origin: "", destination: "", sipCallId: "" });

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced({ origin, destination, sipCallId }), 300);
    return () => clearTimeout(t);
  }, [origin, destination, sipCallId]);

  React.useEffect(() => setPage(1), [debounced, status]);

  const { data, isLoading } = useTelephonyCalls(
    { page, pageSize: PAGE_SIZE, ...debounced, status },
    live,
  );

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Telephony (SIP/RTP)"
        description="SIP trunk observability — message flow, call quality, and PCAP export, independent of the app-level call logs."
      />

      <Card className="mb-3 py-0">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Origin…" value={origin} onChange={(e) => setOrigin(e.target.value)} className="h-8 w-36 pl-8" />
          </div>
          <Input placeholder="Destination…" value={destination} onChange={(e) => setDestination(e.target.value)} className="h-8 w-36" />
          <Input placeholder="Call-ID…" value={sipCallId} onChange={(e) => setSipCallId(e.target.value)} className="h-8 w-48 font-mono text-xs" />
          <Select value={status ?? ANY} onValueChange={(v) => setStatus(v && v !== ANY ? (v as SipCallStatus) : undefined)}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              <SelectItem value="activa">Active</SelectItem>
              <SelectItem value="finalizada">Completed</SelectItem>
              <SelectItem value="fallida">Failed</SelectItem>
              <SelectItem value="no_contesto">No answer</SelectItem>
            </SelectContent>
          </Select>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={live} onCheckedChange={setLive} />
            Live
          </label>
          <span className="text-sm text-muted-foreground">{formatNumber(total)} calls</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="list">
        <TabsList className="mb-3">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Methods</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : data!.rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-muted-foreground">{new Date(r.startTime).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-xs">
                              {r.direction === "inbound" ? <ArrowDown className="size-3 text-success" /> : <ArrowUp className="size-3 text-primary" />}
                              {r.direction === "inbound" ? "Inbound" : "Outbound"}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.origin}</TableCell>
                          <TableCell className="font-mono text-xs">{r.destination}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtDuration(r.durationSecs)}</TableCell>
                          <TableCell><SipStatusChip status={r.status} /></TableCell>
                          <TableCell><MethodChips methods={r.methodsSequence} /></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" render={<Link href={`/infra/telephony/${r.linkedCallId ?? r.id}`} />}>
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total calls" value={formatNumber(data?.stats.totalCalls ?? 0)} loading={isLoading} />
            <KpiCard label="Failure rate" value={`${data?.stats.failureRate ?? 0}%`} loading={isLoading} accent="orange" goodDirection="down" />
            <KpiCard label="Avg setup time" value={`${data?.stats.avgSetupMs ?? 0} ms`} loading={isLoading} />
            <KpiCard label="Failure codes" value={data?.stats.topFailureCodes.length ?? 0} loading={isLoading} sub="distinct codes" />
          </div>
          <Card className="mt-3">
            <CardContent className="pt-4">
              <div className="mb-2 text-sm font-semibold">Top failure codes</div>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : data && data.stats.topFailureCodes.length > 0 ? (
                <div className="space-y-1.5">
                  {data.stats.topFailureCodes.map((f) => (
                    <div key={f.code} className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className="font-mono">{f.code}</Badge>
                      <span className="tabular-nums text-muted-foreground">{f.count} calls</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No failures in the selected range.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
