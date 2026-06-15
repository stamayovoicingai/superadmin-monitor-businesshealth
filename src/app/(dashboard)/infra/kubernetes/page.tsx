"use client";

import { Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GaugeChart, MultiLineChart } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfraK8s } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { canSeeSuperAdminOnly } from "@/lib/auth/policy";
import { formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ReqLimitBar({ label, request, limit, unit }: { label: string; request: number; limit: number; unit: string }) {
  const pct = limit > 0 ? Math.min(100, (request / limit) * 100) : 0;
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          req {request}{unit} / lim {limit}{unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function KubernetesPage() {
  const { role } = useView();
  const { data, isLoading } = useInfraK8s();

  if (!canSeeSuperAdminOnly(role)) {
    return (
      <div>
        <PageHeader title="Kubernetes" description="Cluster, pods and container monitoring." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Lock className="size-6" /></div>
            <div className="text-lg font-semibold">SuperAdmin only</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const c = data?.cluster;

  return (
    <div>
      <PageHeader
        title="Kubernetes"
        description="Cluster / pods / containers usage, requests & limits, restarts and logs (Prometheus)."
        actions={
          <Badge variant="secondary" className="font-mono">
            {data?.selectedNamespace ?? "cluster-wide"}
          </Badge>
        }
      />

      {/* Cluster Usage */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cluster Usage</CardTitle></CardHeader>
        <CardContent>
          {isLoading || !c ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid grid-cols-3">
                <GaugeChart value={c.cpuPct} label="CPU (1m avg)" />
                <GaugeChart value={c.memPct} label="Memory" />
                <GaugeChart value={c.storagePct} label="Storage" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label="CPU Used" value={`${c.cpuUsedCores} cores`} />
                <Stat label="CPU Total" value={`${c.cpuTotalCores} cores`} />
                <Stat label="Replicas" value={formatNumber(c.replicaCount)} />
                <Stat label="Mem Used" value={`${c.memUsedGiB} GiB`} />
                <Stat label="Mem Total" value={`${c.memTotalGiB} GiB`} />
                <Stat label="Storage" value={`${c.storageUsedGiB}/${c.storageTotalGiB} GiB`} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Overall Usage</CardTitle><CardDescription>Cluster CPU & memory %</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[240px] w-full" /> : (
            <MultiLineChart data={data!.overall} unit="%" keys={[
              { key: "cpu", label: "CPU", color: "var(--chart-1)" },
              { key: "mem", label: "Memory", color: "var(--chart-2)" },
            ]} />
          )}
        </CardContent>
      </Card>

      {/* Pods Usage */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Pods CPU Usage (1m avg)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full" /> : (
              <MultiLineChart data={data!.podCpu} unit="" keys={data!.podKeys.map((k, i) => ({ key: k, label: k, color: COLORS[i % COLORS.length] }))} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pods Memory Usage</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full" /> : (
              <MultiLineChart data={data!.podMem} unit=" GiB" keys={data!.podKeys.map((k, i) => ({ key: k, label: k, color: COLORS[i % COLORS.length] }))} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Containers Usage */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Containers CPU Usage</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full" /> : (
              <MultiLineChart data={data!.containerCpu} keys={data!.containerKeys.map((k, i) => ({ key: k, label: k, color: COLORS[i % COLORS.length] }))} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Containers Memory Usage</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full" /> : (
              <MultiLineChart data={data!.containerMem} unit=" GiB" keys={data!.containerKeys.map((k, i) => ({ key: k, label: k, color: COLORS[i % COLORS.length] }))} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Requests & Limits + Restarts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Container Requests & Limits</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !data ? <Skeleton className="h-40 w-full" /> : data.requestsLimits.map((r) => (
              <div key={r.container} className="space-y-2">
                <div className="font-mono text-xs font-medium">{r.container}</div>
                <ReqLimitBar label="CPU" request={r.cpuRequest} limit={r.cpuLimit} unit=" cores" />
                <ReqLimitBar label="Memory" request={r.memRequestGiB} limit={r.memLimitGiB} unit=" GiB" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Container Restarts</CardTitle>
            <CardDescription>{isLoading ? "" : `Total ${data!.restartsTotal} restart(s)`}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px] w-full" /> : (
              <MultiLineChart data={data!.restarts} height={200} keys={[{ key: "restarts", label: "Restarts", color: "var(--chart-4)" }]} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Deployment Logs</CardTitle><CardDescription>Loki</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-40 w-full" /> : (
            <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
              {data!.logs.map((l, i) => (
                <div key={i}>
                  <span className="text-muted-foreground">{new Date(l.ts).toLocaleTimeString()} </span>
                  <span className={cn(l.level === "ERROR" ? "text-critical" : l.level === "WARN" ? "text-warning" : "text-success")}>[{l.level}]</span>{" "}
                  <span>{l.line}</span>
                </div>
              ))}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
