"use client";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { CostByServiceChart, CostRevenueChart, ServiceDonut } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCost } from "@/lib/hooks";
import { useFinancials } from "@/components/financial-gate";
import { formatMicros, formatMicrosCompact, formatMicrosPrecise, formatPct } from "@/lib/money";
import { marginPct } from "@/lib/engine/cost";

export default function CostPage() {
  const { data, isLoading } = useCost();
  const fin = useFinancials();
  const t = data?.totals;
  const mPct = t ? marginPct(t.revenueMicros, t.costMicros) : 0;
  const costPerCall = t && t.calls ? Math.round(t.costMicros / t.calls) : 0;

  return (
    <div>
      <PageHeader
        title="Cost & Margin"
        description={fin ? "Real per-service cost, revenue and margin." : "Operating cost to serve (no revenue/margin for your role)."}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Cost" value={t ? formatMicrosCompact(t.costMicros) : "—"} loading={isLoading} accent="orange" />
        <KpiCard label="Cost / call" value={t ? formatMicrosPrecise(costPerCall) : "—"} loading={isLoading} accent="violet" goodDirection="down" />
        {fin && <KpiCard label="Revenue" value={t ? formatMicrosCompact(t.revenueMicros) : "—"} loading={isLoading} accent="blue" />}
        {fin ? (
          <KpiCard label="Margin %" value={t ? formatPct(mPct) : "—"} loading={isLoading} accent="green" />
        ) : (
          <KpiCard label="Calls" value={t ? formatMicros(t.costMicros) : "—"} loading={isLoading} />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost by service</CardTitle>
            <CardDescription>Stacked daily cost across providers</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[260px] w-full" /> : <CostByServiceChart series={data!.series} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cost mix</CardTitle>
            <CardDescription>Share by service (period)</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[220px] w-full" /> : <ServiceDonut service={data!.totals.service} />}</CardContent>
        </Card>
      </div>

      {fin && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Cost vs Revenue</CardTitle>
            <CardDescription>Daily cost, revenue and margin</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[260px] w-full" /> : <CostRevenueChart series={data!.series} />}</CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Margin by project</CardTitle>
          <CardDescription>Per-project cost{fin ? ", revenue and margin" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                {fin && <TableHead className="text-right">Revenue</TableHead>}
                {fin && <TableHead className="text-right">Margin</TableHead>}
                {fin && <TableHead className="text-right">Margin %</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={fin ? 6 : 3}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data!.projects.map((p) => {
                    const pm = marginPct(p.revenueMicros, p.costMicros);
                    const low = pm < 0.3;
                    return (
                      <TableRow key={p.projectId}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.orgName}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMicros(p.costMicros)}</TableCell>
                        {fin && <TableCell className="text-right tabular-nums">{formatMicros(p.revenueMicros)}</TableCell>}
                        {fin && <TableCell className="text-right tabular-nums">{formatMicros(p.marginMicros)}</TableCell>}
                        {fin && (
                          <TableCell className="text-right">
                            <Badge className={low ? "bg-critical/10 text-critical" : "bg-success/10 text-success"}>{formatPct(pm)}</Badge>
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
