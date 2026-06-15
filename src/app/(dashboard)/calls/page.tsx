"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flag, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DispositionBadge, EndReasonChip, StatusChip } from "@/components/chips";
import { useCalls } from "@/lib/hooks";
import { useFinancials } from "@/components/financial-gate";
import { formatMicros, formatMicrosPrecise, formatNumber } from "@/lib/money";

const ANY = "__any__";
const PAGE_SIZE = 25;

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CallsPage() {
  const fin = useFinancials();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<string>();
  const [reason, setReason] = React.useState<string>();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => setPage(1), [status, reason, debounced]);

  const { data, isLoading } = useCalls({
    page,
    pageSize: PAGE_SIZE,
    status,
    closedReason: reason,
    search: debounced,
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Call Logs" description="Filterable call history. Click a row for full detail." />

      <Card className="mb-3 py-0">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search call / session / pod…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-64 pl-8"
            />
          </div>
          <Select value={status ?? ANY} onValueChange={(v) => setStatus(v && v !== ANY ? v : undefined)}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reason ?? ANY} onValueChange={(v) => setReason(v && v !== ANY ? v : undefined)}>
            <SelectTrigger size="sm" className="w-[180px]">
              <SelectValue placeholder="End reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any end reason</SelectItem>
              <SelectItem value="USER_DISCONNECTED">User disconnected</SelectItem>
              <SelectItem value="CALL_END_PHRASE_TRIGGERED">End phrase</SelectItem>
              <SelectItem value="USER_IDLE">User idle</SelectItem>
              <SelectItem value="CALL_TRANSFERRED">Transferred</SelectItem>
              <SelectItem value="PIPELINE_TTL_TRIGGERED">Max duration</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">{formatNumber(total)} calls</span>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Start</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>End reason</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                {fin && <TableHead className="text-right">Margin</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={fin ? 11 : 10}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data!.rows.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell className="font-mono text-xs">
                        <Link href={`/calls/${c.callId}`} className="inline-flex items-center gap-1 hover:underline">
                          {c.flagged && <Flag className="size-3 text-warning" />}
                          {c.callId}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">{c.projectName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.agentName}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(c.startTime).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtDuration(c.durationSecs)}</TableCell>
                      <TableCell><StatusChip status={c.status} /></TableCell>
                      <TableCell><EndReasonChip reason={c.closedReason} /></TableCell>
                      <TableCell><DispositionBadge disposition={c.disposition} /></TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(c.latency.totalMs)} ms</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMicrosPrecise(c.cost.totalMicros)}</TableCell>
                      {fin && (
                        <TableCell className="text-right tabular-nums" style={{ color: c.cost.marginMicros >= 0 ? "var(--success)" : "var(--critical)" }}>
                          {formatMicros(c.cost.marginMicros)}
                        </TableCell>
                      )}
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
    </div>
  );
}
