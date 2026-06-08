"use client";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { SimpleDonut } from "@/components/charts";
import { LiveDot } from "@/components/chips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveOps } from "@/lib/hooks";
import { formatNumber } from "@/lib/money";
import type { ChartConfig } from "@/components/ui/chart";

const STATUS_CONFIG: ChartConfig = {
  ACTIVE: { label: "Active", color: "var(--chart-3)" },
  COMPLETED: { label: "Completed", color: "var(--chart-1)" },
  FAILED: { label: "Failed", color: "var(--chart-4)" },
};

const REASON_CONFIG: ChartConfig = {
  USER_DISCONNECTED: { label: "Disconnected", color: "var(--chart-1)" },
  CALL_END_PHRASE_TRIGGERED: { label: "End phrase", color: "var(--chart-2)" },
  USER_IDLE: { label: "Idle", color: "var(--chart-3)" },
  CALL_TRANSFERRED: { label: "Transferred", color: "var(--chart-4)" },
  OTHER: { label: "Other", color: "var(--chart-5)" },
};

function elapsed(startISO: string) {
  const s = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function LivePage() {
  const { data, isLoading, dataUpdatedAt } = useLiveOps(true);

  return (
    <div>
      <PageHeader
        title="Live Operations"
        description="Active calls, concurrency and outcomes — refreshes every 20s."
        actions={
          <div className="flex items-center gap-3">
            <LiveDot />
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-muted-foreground">tick {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Concurrent calls" value={data ? formatNumber(data.concurrency) : "—"} loading={isLoading} accent="green" sub="active now" />
        <KpiCard label="Active pods" value={data ? formatNumber(data.activePods) : "—"} loading={isLoading} accent="blue" />
        <KpiCard label="Closed (range)" value={data ? formatNumber(data.closedInPeriod) : "—"} loading={isLoading} accent="violet" />
        <KpiCard label="Errors (range)" value={data ? formatNumber(data.errorsInPeriod) : "—"} loading={isLoading} accent="orange" goodDirection="down" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active calls per pod</CardTitle>
            <CardDescription>Load distribution</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pod</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ) : data!.podLoads.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No active calls</TableCell></TableRow>
                ) : (
                  data!.podLoads.map((p) => (
                    <TableRow key={p.hostId}>
                      <TableCell className="font-mono text-xs">{p.hostId}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{p.activeCalls}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calls status</CardTitle>
            <CardDescription>Active vs closed</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <SimpleDonut config={STATUS_CONFIG} data={data!.statusCounts.map((s) => ({ key: s.status, value: s.count }))} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call end reason</CardTitle>
            <CardDescription>Why calls ended</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <SimpleDonut config={REASON_CONFIG} data={data!.endReasonCounts.map((s) => ({ key: s.reason, value: s.count }))} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Active calls</CardTitle>
          <CardDescription>Calls in progress right now</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Pod</TableHead>
                <TableHead className="text-right">Elapsed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              ) : data!.activeCalls.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No active calls right now</TableCell></TableRow>
              ) : (
                data!.activeCalls.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.callId}</TableCell>
                    <TableCell>{c.projectName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.hostId}</TableCell>
                    <TableCell className="text-right tabular-nums">{elapsed(c.startTime)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
