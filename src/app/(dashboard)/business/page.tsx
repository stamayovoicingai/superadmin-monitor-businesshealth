"use client";

import { Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { MrrChart, CallersChart, VBarChart } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useBusiness } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { canSeeSuperAdminOnly } from "@/lib/auth/policy";
import { formatMicros, formatMicrosCompact, formatNumber, formatPct } from "@/lib/money";

export default function BusinessPage() {
  const { role } = useView();
  const { data, isLoading } = useBusiness();

  if (!canSeeSuperAdminOnly(role)) {
    return (
      <div>
        <PageHeader title="Business Health" description="Voicing AI business & platform usage metrics." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Lock className="size-6" />
            </div>
            <div className="text-lg font-semibold">SuperAdmin only</div>
            <p className="max-w-md text-sm text-muted-foreground">
              Business & financial metrics (MRR, churn, growth) are restricted to the SuperAdmin role.
              Switch role with the “View as” control to preview.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Business Health"
        description="Voicing AI recurring revenue and platform usage. Revenue figures are modeled from contracts."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="MRR" value={data ? formatMicrosCompact(data.mrrMicros) : "—"} delta={data?.mrrDeltaPct} loading={isLoading} accent="green" sub="recurring / month" />
        <KpiCard label="Expansion" value={data ? formatMicrosCompact(data.expansionMicros) : "—"} loading={isLoading} accent="violet" sub="MGF overage" />
        <KpiCard label="Churn" value={data ? formatPct(data.churnRatePct) : "—"} loading={isLoading} accent="orange" goodDirection="down" sub="logo churn" />
        <KpiCard label="Active orgs" value={data ? formatNumber(data.activeOrgs) : "—"} loading={isLoading} accent="blue" sub={data ? `${data.newOrgs} new` : undefined} />
        <KpiCard label="Minutes spoken" value={data ? formatNumber(Math.round(data.totalMinutes)) : "—"} loading={isLoading} accent="blue" sub="period" />
        <KpiCard label="Active agents" value={data ? formatNumber(data.activeAgents) : "—"} loading={isLoading} accent="violet" sub="with calls" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>MRR composition</CardTitle>
          <CardDescription>Committed (MGF) · Usage · Expansion — trailing 12 months</CardDescription>
        </CardHeader>
        <CardContent>{isLoading ? <Skeleton className="h-[280px] w-full" /> : <MrrChart series={data!.mrrSeries} />}</CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization growth</CardTitle>
            <CardDescription>Active organizations by month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <VBarChart isMonth data={data!.orgGrowthSeries.map((p) => ({ label: p.month, value: p.activeOrgs }))} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New vs returning callers</CardTitle>
            <CardDescription>
              {data ? `${formatNumber(data.newCallers)} new · ${formatNumber(data.returningCallers)} returning (period)` : "Daily unique callers"}
            </CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[260px] w-full" /> : <CallersChart series={data!.callersSeries} />}</CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Ranked by MRR</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Margin (period)</TableHead>
                <TableHead className="text-right">Minutes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data!.orgs.map((o) => (
                    <TableRow key={o.name}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMicros(o.mrrMicros)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={o.marginMicros >= 0 ? "bg-success/10 text-success" : "bg-critical/10 text-critical"}>
                          {formatMicros(o.marginMicros)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(Math.round(o.minutes))}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
