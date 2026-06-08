"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { microsToUsd } from "@/lib/money";
import type { ServiceCostBreakdown, TimePoint } from "@/lib/types";

const SERVICE_CONFIG: ChartConfig = {
  llm: { label: "LLM", color: "var(--chart-1)" },
  stt: { label: "STT", color: "var(--chart-2)" },
  tts: { label: "TTS", color: "var(--chart-3)" },
  telephony: { label: "Telephony", color: "var(--chart-4)" },
  cloud: { label: "Cloud", color: "var(--chart-5)" },
};

const shortDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${m}/${day}`;
};

export function CostByServiceChart({ series }: { series: TimePoint[] }) {
  const data = series.map((p) => ({
    date: p.date,
    llm: microsToUsd(p.service.llmMicros),
    stt: microsToUsd(p.service.sttMicros),
    tts: microsToUsd(p.service.ttsMicros),
    telephony: microsToUsd(p.service.telephonyMicros),
    cloud: microsToUsd(p.service.cloudMicros),
  }));
  return (
    <ChartContainer config={SERVICE_CONFIG} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {(["llm", "stt", "tts", "telephony", "cloud"] as const).map((k) => (
          <Area key={k} dataKey={k} type="monotone" stackId="1" stroke={`var(--color-${k})`} fill={`var(--color-${k})`} fillOpacity={0.25} />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

export function CostRevenueChart({ series }: { series: TimePoint[] }) {
  const config: ChartConfig = {
    cost: { label: "Cost", color: "var(--chart-4)" },
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    margin: { label: "Margin", color: "var(--chart-3)" },
  };
  const data = series.map((p) => ({
    date: p.date,
    cost: microsToUsd(p.costMicros),
    revenue: microsToUsd(p.revenueMicros),
    margin: microsToUsd(p.marginMicros),
  }));
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area dataKey="revenue" type="monotone" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.15} />
        <Area dataKey="cost" type="monotone" stroke="var(--color-cost)" fill="var(--color-cost)" fillOpacity={0.15} />
        <Line dataKey="margin" type="monotone" stroke="var(--color-margin)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ChartContainer>
  );
}

export function LatencyTrendChart({
  series,
}: {
  series: { date: string; totalMs: number; llmMs: number; sttMs: number; ttsMs: number }[];
}) {
  const config: ChartConfig = {
    totalMs: { label: "Total", color: "var(--chart-1)" },
    llmMs: { label: "LLM", color: "var(--chart-2)" },
    sttMs: { label: "STT", color: "var(--chart-3)" },
    ttsMs: { label: "TTS", color: "var(--chart-4)" },
  };
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v) => `${v}ms`} tickLine={false} axisLine={false} width={52} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="totalMs" type="monotone" stroke="var(--color-totalMs)" strokeWidth={2} dot={false} />
        <Line dataKey="llmMs" type="monotone" stroke="var(--color-llmMs)" strokeWidth={1.5} dot={false} />
        <Line dataKey="sttMs" type="monotone" stroke="var(--color-sttMs)" strokeWidth={1.5} dot={false} />
        <Line dataKey="ttsMs" type="monotone" stroke="var(--color-ttsMs)" strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ChartContainer>
  );
}

export function ServiceDonut({ service }: { service: ServiceCostBreakdown }) {
  const data = [
    { key: "llm", value: microsToUsd(service.llmMicros) },
    { key: "stt", value: microsToUsd(service.sttMicros) },
    { key: "tts", value: microsToUsd(service.ttsMicros) },
    { key: "telephony", value: microsToUsd(service.telephonyMicros) },
    { key: "cloud", value: microsToUsd(service.cloudMicros) },
  ];
  return (
    <ChartContainer config={SERVICE_CONFIG} className="mx-auto aspect-square h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius={55} strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={`var(--color-${d.key})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function SimpleDonut({
  data,
  config,
}: {
  data: { key: string; value: number }[];
  config: ChartConfig;
}) {
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[200px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius={50} strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={config[d.key]?.color ?? "var(--chart-5)"} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function HBarChart({
  data,
  unit = "$",
}: {
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const config: ChartConfig = { value: { label: "Value", color: "var(--chart-1)" } };
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(v) => `${unit}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
