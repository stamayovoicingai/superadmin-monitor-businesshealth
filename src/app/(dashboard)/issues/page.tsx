"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { SeverityBadge } from "@/components/chips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIssues } from "@/lib/hooks";
import { formatMetric } from "@/lib/engine/issues";
import { formatNumber } from "@/lib/money";

export default function IssuesPage() {
  const { data, isLoading } = useIssues();

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Active issues derived from configurable thresholds. Critical breaches are auto-flagged to the review queue."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Critical" value={data ? data.summary.critical : "—"} loading={isLoading} accent="orange" goodDirection="down" />
        <KpiCard label="Warning" value={data ? data.summary.warning : "—"} loading={isLoading} accent="violet" goodDirection="down" />
        <KpiCard label="Affected calls" value={data ? formatNumber(data.summary.affectedCalls) : "—"} loading={isLoading} accent="blue" goodDirection="down" />
        <KpiCard label="Auto-flagged" value={data ? formatNumber(data.summary.autoFlagged) : "—"} loading={isLoading} accent="orange" goodDirection="down" sub="→ Flag Queue" />
      </div>

      {/* Issues by category */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Issues by category</CardTitle>
          <CardDescription>Configurable categories from Thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {data!.byCategory.map((c) => (
                <div key={c.categoryId} className="rounded-lg border p-3">
                  <div className="text-sm font-semibold">{c.categoryName}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <span className="font-medium text-critical">{c.critical} critical</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium text-warning">{c.warning} warning</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatNumber(c.affectedCalls)} affected calls</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active issues */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Active issues</CardTitle>
          <CardDescription>Threshold breaches in the current scope &amp; range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : data!.issues.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No active issues — all thresholds are within range. ✅</p>
          ) : (
            data!.issues.map((iss) => (
              <div key={iss.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={iss.severity} />
                  <span className="font-medium">{iss.metricLabel}</span>
                  <Badge variant="outline">{iss.categoryName}</Badge>
                  <Badge variant="secondary" className="font-mono">{iss.scopeLabel}</Badge>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {iss.kind === "aggregate" ? (
                      <>actual <b className="text-foreground">{formatMetric(iss.metric, iss.value)}</b> {iss.comparator === "gt" ? ">" : "<"} {formatMetric(iss.metric, iss.thresholdValue)}</>
                    ) : (
                      <><b className="text-foreground">{formatNumber(iss.count)}</b> call(s) {iss.comparator === "gt" ? ">" : "<"} {formatMetric(iss.metric, iss.thresholdValue)} (worst {formatMetric(iss.metric, iss.value)})</>
                    )}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Affected projects:</span>
                  {iss.affectedProjects.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                  {iss.severity === "critical" && (
                    <Badge className="ml-1 gap-1 bg-warning/10 text-warning">
                      <Flag className="size-3" /> auto-flagged
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>last seen {new Date(iss.lastSeen).toLocaleString()}</span>
                  <span>·</span>
                  <span className="flex flex-wrap gap-2">
                    {iss.affectedCalls.slice(0, 6).map((ac) => (
                      <Link key={ac.callId} href={`/calls/${ac.callId}`} className="font-mono text-primary hover:underline">
                        {ac.callId}
                      </Link>
                    ))}
                    {iss.count > 6 && <span>+{iss.count - 6} more</span>}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
