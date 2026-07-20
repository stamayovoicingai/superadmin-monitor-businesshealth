"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MultiLineChart } from "@/components/charts";
import { DateRangeControl } from "@/components/date-range-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfraElb } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { canSeeOpsModules } from "@/lib/auth/policy";
import type { ElbPoint } from "@/lib/data/source";
import type { RangeState } from "@/lib/period";

const G = "var(--chart-3)";
const B = "var(--chart-1)";
const V = "var(--chart-2)";
const O = "var(--chart-4)";
const R = "var(--critical)";
const M = "var(--chart-5)";

function Panel({
  title,
  data,
  keys,
  unit,
  loading,
}: {
  title: string;
  data?: ElbPoint[];
  keys: { key: string; label: string; color: string }[];
  unit?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading || !data ? <Skeleton className="h-[220px] w-full" /> : <MultiLineChart data={data} keys={keys} unit={unit} height={220} />}
      </CardContent>
    </Card>
  );
}

export default function ElbPage() {
  const { role } = useView();
  const [range, setRange] = React.useState<RangeState>({ preset: "24h" });
  const { data, isLoading } = useInfraElb(range);

  if (!canSeeOpsModules(role)) {
    return (
      <div>
        <PageHeader title="AWS ELB" description="Application Load Balancer metrics." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Lock className="size-6" /></div>
            <div className="text-lg font-semibold">Not available for your role</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="AWS ELB — Application Load Balancer"
        description="CloudWatch metrics for the platform load balancer."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">{data?.regions[0] ?? "us-east-1"}</Badge>
            <Badge variant="secondary" className="font-mono">{data?.selectedLb ?? "—"}</Badge>
            <DateRangeControl value={range} onChange={setRange} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="RequestCount / TargetResponseTime" loading={isLoading} data={data?.requests} keys={[
          { key: "requestCount", label: "RequestCount", color: B },
          { key: "responseMs", label: "TargetResponseTime (ms)", color: O },
        ]} />
        <Panel title="HTTPCode_Target" loading={isLoading} data={data?.httpTarget} keys={[
          { key: "code2xx", label: "2xx", color: G },
          { key: "code3xx", label: "3xx", color: B },
          { key: "code4xx", label: "4xx", color: O },
          { key: "code5xx", label: "5xx", color: R },
        ]} />
        <Panel title="HTTPCode_ELB" loading={isLoading} data={data?.httpElb} keys={[
          { key: "elb3xx", label: "3xx", color: B },
          { key: "elb4xx", label: "4xx", color: O },
          { key: "elb5xx", label: "5xx", color: R },
        ]} />
        <Panel title="ConnectionCount" loading={isLoading} data={data?.connections} keys={[
          { key: "active", label: "Active", color: B },
          { key: "new", label: "New", color: G },
          { key: "rejected", label: "Rejected", color: O },
          { key: "targetErr", label: "Target conn error", color: R },
        ]} />
        <Panel title="Consumed LCUs / ProcessedBytes" loading={isLoading} data={data?.capacity} keys={[
          { key: "lcu", label: "Consumed LCUs", color: V },
          { key: "processedMB", label: "Processed (MB)", color: B },
        ]} />
        <Panel title="TLS Negotiation Errors" loading={isLoading} data={data?.tls} keys={[
          { key: "client", label: "Client TLS errors", color: O },
          { key: "target", label: "Target TLS errors", color: R },
        ]} />
        <Panel title="IPv6" loading={isLoading} data={data?.ipv6} keys={[
          { key: "requests", label: "IPv6 RequestCount", color: B },
          { key: "processedMB", label: "IPv6 Processed (MB)", color: V },
        ]} />
        <Panel title="RuleEvaluations" loading={isLoading} data={data?.ruleEvals} keys={[
          { key: "evals", label: "Rule evaluations", color: M },
        ]} />
        <Panel title="Auth" loading={isLoading} data={data?.auth} keys={[
          { key: "success", label: "Success", color: G },
          { key: "error", label: "Error", color: O },
          { key: "failure", label: "Failure", color: R },
        ]} />
      </div>
    </div>
  );
}
