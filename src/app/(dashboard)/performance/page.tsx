"use client";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { HBarChart, LatencyTrendChart } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerformance } from "@/lib/hooks";
import { formatNumber, formatPct } from "@/lib/money";

export default function PerformancePage() {
  const { data, isLoading } = usePerformance();
  const s = data?.perService;

  return (
    <div>
      <PageHeader title="Performance" description="Latency and reliability per service (snapshot)." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Avg latency / call" value={data ? `${formatNumber(data.avgLatencyMs)} ms` : "—"} loading={isLoading} accent="violet" goodDirection="down" />
        <KpiCard label="Error rate" value={data ? formatPct(data.errorRate) : "—"} loading={isLoading} accent="orange" goodDirection="down" />
        <KpiCard label="LLM latency" value={s ? `${formatNumber(s.llmMs)} ms` : "—"} loading={isLoading} accent="blue" goodDirection="down" />
        <KpiCard label="TTS latency" value={s ? `${formatNumber(s.ttsMs)} ms` : "—"} loading={isLoading} accent="green" goodDirection="down" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency over time</CardTitle>
            <CardDescription>Daily average, overall and per service</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[260px] w-full" /> : <LatencyTrendChart series={data!.latencySeries} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latency by service</CardTitle>
            <CardDescription>Average milliseconds per service (period)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <HBarChart
                unit=""
                data={[
                  { label: "LLM", value: s!.llmMs },
                  { label: "STT", value: s!.sttMs },
                  { label: "TTS", value: s!.ttsMs },
                  { label: "Tool exec", value: s!.toolMs },
                  { label: "Telephony", value: s!.telephonyMs },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
