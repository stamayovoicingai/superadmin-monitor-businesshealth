"use client";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { CostTrendChart, HBarChart } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssistant } from "@/lib/hooks";
import { formatMicros, formatMicrosCompact, formatNumber, microsToUsd } from "@/lib/money";

export default function AssistantPage() {
  const { data, isLoading } = useAssistant();
  const t = data?.totals;

  return (
    <div>
      <PageHeader
        title="Assistant Usage"
        description="platform.voicing.ai assistant — usage & cost per project and per subagent. Tracked separately from call COGS."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Assistant cost" value={t ? formatMicrosCompact(t.costMicros) : "—"} loading={isLoading} accent="violet" sub="period · platform usage" />
        <KpiCard label="Invocations" value={t ? formatNumber(t.invocations) : "—"} loading={isLoading} accent="blue" />
        <KpiCard label="Input tokens" value={t ? formatNumber(t.inputTokens) : "—"} loading={isLoading} accent="blue" />
        <KpiCard label="Output tokens" value={t ? formatNumber(t.outputTokens) : "—"} loading={isLoading} accent="green" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Assistant cost over time</CardTitle>
          <CardDescription>Daily platform-assistant spend</CardDescription>
        </CardHeader>
        <CardContent>{isLoading ? <Skeleton className="h-[260px] w-full" /> : <CostTrendChart series={data!.series} label="Assistant cost" />}</CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by subagent</CardTitle>
            <CardDescription>Each subagent runs on its own LLM model</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subagent</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Invocations</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : data!.bySubagent.map((s) => (
                      <TableRow key={s.subagent}>
                        <TableCell className="font-medium">{s.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">{s.model}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(s.invocations)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMicros(s.costMicros)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by project</CardTitle>
            <CardDescription>Assistant spend per project (top)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <HBarChart data={data!.byProject.slice(0, 10).map((p) => ({ label: p.projectName, value: microsToUsd(p.costMicros) }))} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
