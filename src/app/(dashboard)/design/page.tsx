"use client";

import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DispositionBadge,
  EndReasonChip,
  LiveDot,
  SeverityBadge,
  StatusChip,
} from "@/components/chips";
import { CostByServiceChart, GaugeChart, ServiceDonut } from "@/components/charts";
import type { ServiceCostBreakdown, TimePoint } from "@/lib/types";

const COLORS: { label: string; cls: string; hex: string }[] = [
  { label: "background", cls: "bg-background", hex: "#F9F7F4" },
  { label: "foreground", cls: "bg-foreground", hex: "#1B1714" },
  { label: "primary", cls: "bg-primary", hex: "#DA5326" },
  { label: "secondary", cls: "bg-secondary", hex: "#EFE9DF" },
  { label: "muted", cls: "bg-muted", hex: "#F1ECE3" },
  { label: "accent", cls: "bg-accent", hex: "#F7E7DF" },
  { label: "border", cls: "bg-border", hex: "#E6DFD2" },
  { label: "success", cls: "bg-success", hex: "#16A34A" },
  { label: "warning", cls: "bg-warning", hex: "#C2700A" },
  { label: "critical", cls: "bg-critical", hex: "#DC2626" },
  { label: "brand-orange", cls: "bg-brand-orange", hex: "#DA5326" },
  { label: "brand-cream", cls: "bg-brand-cream", hex: "#F9F7F4" },
];
const CHARTS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

const sampleService: ServiceCostBreakdown = {
  llmMicros: 1_250_000,
  sttMicros: 420_000,
  ttsMicros: 680_000,
  telephonyMicros: 300_000,
  cloudMicros: 180_000,
};
const sampleSeries: TimePoint[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 5, i + 1).toISOString();
  const f = 1 + 0.3 * Math.sin(i / 2);
  const svc: ServiceCostBreakdown = {
    llmMicros: Math.round(900_000 * f),
    sttMicros: Math.round(300_000 * f),
    ttsMicros: Math.round(500_000 * f),
    telephonyMicros: Math.round(220_000 * f),
    cloudMicros: Math.round(140_000 * f),
  };
  const cost = Object.values(svc).reduce((s, v) => s + v, 0);
  return { date: d, costMicros: cost, revenueMicros: Math.round(cost * 1.6), marginMicros: Math.round(cost * 0.6), minutes: 0, calls: 0, service: svc };
});

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DesignSystemPage() {
  return (
    <div>
      <PageHeader
        title="Design System"
        description="Tokens and reusable components extracted from voicing.ai (Inter + Instrument Serif, cream + orange). Use these primitives — don't hardcode colors or fonts."
      />

      <Section title="Colors" desc="Semantic tokens — reference by name (bg-primary, text-success…), never hardcode hex.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLORS.map((c) => (
            <div key={c.label} className="space-y-1.5">
              <div className={`h-14 rounded-lg border ${c.cls}`} />
              <div className="text-xs font-medium">{c.label}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{c.hex}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs font-medium text-muted-foreground">Chart palette (chart-1…5)</div>
        <div className="mt-2 flex gap-2">
          {CHARTS.map((c) => (
            <div key={c} className={`h-10 flex-1 rounded-lg ${c}`} />
          ))}
        </div>
      </Section>

      <Section title="Typography" desc="Instrument Serif for display (titles, KPI numbers); Inter for UI/body; Geist Mono for code/ids.">
        <div className="space-y-3">
          <div className="font-display text-4xl">Display — Instrument Serif</div>
          <div className="font-display text-3xl tabular-nums">$12,480 · 99.9%</div>
          <p className="text-base">Body — Inter regular. The hybrid voice intelligence stack for Fortune 2000 enterprises.</p>
          <p className="text-sm text-muted-foreground">Muted small — Inter 14px. Secondary text and captions.</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="font-light">Light 300</span>
            <span className="font-normal">Regular 400</span>
            <span className="font-medium">Medium 500</span>
            <span className="font-semibold">Semibold 600</span>
            <span className="font-bold">Bold 700</span>
          </div>
          <code className="font-mono text-xs text-muted-foreground">CALL-TELMEX-1452 · session-9f2a · host-pod-3</code>
        </div>
      </Section>

      <Section title="Buttons" desc="Pill buttons. Variants: default · secondary · outline · ghost · destructive · link.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
        </div>
      </Section>

      <Section title="Badges & chips" desc="Status, severity, end-reason, disposition, live indicator.">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <StatusChip status="ACTIVE" />
          <StatusChip status="COMPLETED" />
          <StatusChip status="FAILED" />
          <SeverityBadge severity="critical" />
          <SeverityBadge severity="warning" />
          <EndReasonChip reason="PIPELINE_TTL_TRIGGERED" />
          <DispositionBadge disposition="transferred" />
          <LiveDot />
        </div>
      </Section>

      <Section title="KPI cards" desc="<KpiCard> — big serif number + label + delta. Accent maps to a token.">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total Cost" value="$12.4K" sub="7,140 calls" delta={-0.08} goodDirection="down" accent="orange" />
          <KpiCard label="Gross Margin" value="$9.9K" sub="58% margin" delta={0.06} accent="green" />
          <KpiCard label="Avg Latency" value="1,180 ms" delta={0.03} goodDirection="down" accent="violet" />
          <KpiCard label="Active Calls" value="37" sub="right now" accent="blue" />
        </div>
      </Section>

      <Section title="Charts" desc="Recharts via the shadcn chart wrapper. Series use the chart-1…5 palette.">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><CostByServiceChart series={sampleSeries} /></div>
          <div className="flex flex-col items-center justify-center gap-4">
            <GaugeChart value={64} label="CPU" />
            <ServiceDonut service={sampleService} />
          </div>
        </div>
      </Section>

      <Section title="Form controls" desc="Input, Select, Switch.">
        <div className="flex flex-wrap items-center gap-4">
          <Input placeholder="Search…" className="h-8 w-56" />
          <Select defaultValue="all">
            <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              <SelectItem value="tp">TP Latam</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm"><Switch defaultChecked /> Enabled</label>
        </div>
      </Section>

      <Section title="Cards & radius" desc="Card radius 12px · buttons pill · badges/inputs smaller radii.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="py-0"><CardContent className="p-4 text-sm">Card surface (white on cream)</CardContent></Card>
          <div className="rounded-lg border bg-card p-4 text-sm">rounded-lg</div>
          <div className="rounded-full border bg-card px-4 py-2 text-center text-sm">pill</div>
        </div>
      </Section>
    </div>
  );
}
