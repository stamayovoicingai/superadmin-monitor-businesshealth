"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { CostByServiceChart, HBarChart } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverview } from "@/lib/hooks";
import { useFinancials } from "@/components/financial-gate";
import { formatMicros, formatMicrosCompact, formatNumber, formatPct, microsToUsd } from "@/lib/money";
import { marginPct } from "@/lib/engine/cost";

export default function OverviewPage() {
  const { data, isLoading } = useOverview();
  const fin = useFinancials();
  const t = data?.totals;
  const mPct = t ? marginPct(t.revenueMicros, t.costMicros) : 0;

  return (
    <div>
      <PageHeader
        title="Overview"
        description={fin ? "Platform health, cost and margin across all scopes." : "Performance and operating cost for your projects."}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Cost" value={t ? formatMicrosCompact(t.costMicros) : "—"} loading={isLoading} accent="orange" sub={t ? `${formatNumber(t.calls)} calls` : undefined} />
        {fin && <KpiCard label="Revenue" value={t ? formatMicrosCompact(t.revenueMicros) : "—"} loading={isLoading} accent="blue" />}
        {fin && <KpiCard label="Gross Margin" value={t ? formatMicrosCompact(t.marginMicros) : "—"} loading={isLoading} accent="green" sub={t ? formatPct(mPct) + " margin" : undefined} />}
        <KpiCard label="Assistant Cost" value={data ? formatMicrosCompact(data.assistantCostMicros) : "—"} loading={isLoading} accent="violet" sub="platform usage" />
        <KpiCard label="Avg Latency" value={t ? `${formatNumber(t.avgLatencyMs)} ms` : "—"} loading={isLoading} accent="violet" goodDirection="down" />
        <KpiCard label="Active Calls" value={data ? formatNumber(data.activeConcurrency) : "—"} loading={isLoading} accent="green" sub="right now" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by service</CardTitle>
            <CardDescription>LLM · STT · TTS · Telephony · Cloud over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full" /> : <CostByServiceChart series={data!.costSeries} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{fin ? "Margin by organization" : "Cost by organization"}</CardTitle>
            <CardDescription>{fin ? "Gross margin per org (period)" : "Operating cost per org (period)"}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <HBarChart
                data={(data?.orgs ?? []).map((o) => ({
                  label: o.name,
                  value: microsToUsd(fin ? o.marginMicros : o.costMicros),
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Ranked by cost{fin ? " · margin shown" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Avg latency</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                {fin && <TableHead className="text-right">Revenue</TableHead>}
                {fin && <TableHead className="text-right">Margin %</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={fin ? 7 : 5}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data!.projects.map((p) => {
                    const pm = marginPct(p.revenueMicros, p.costMicros);
                    return (
                      <TableRow key={p.projectId}>
                        <TableCell className="font-medium">
                          <Link href="/calls" className="hover:underline">
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.orgName}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(p.calls)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(p.avgLatencyMs)} ms</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMicros(p.costMicros)}</TableCell>
                        {fin && <TableCell className="text-right tabular-nums">{formatMicros(p.revenueMicros)}</TableCell>}
                        {fin && (
                          <TableCell className="text-right tabular-nums font-semibold" style={{ color: pm >= 0 ? "var(--success)" : "var(--critical)" }}>
                            {formatPct(pm)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
