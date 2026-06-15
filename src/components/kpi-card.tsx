import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  delta,
  goodDirection = "up",
  loading,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  /** signed fractional change vs previous period, e.g. 0.12 = +12% */
  delta?: number;
  goodDirection?: "up" | "down";
  loading?: boolean;
  accent?: "blue" | "violet" | "green" | "orange";
}) {
  const accentClass =
    accent === "violet"
      ? "text-brand-violet"
      : accent === "green"
        ? "text-success"
        : accent === "orange"
          ? "text-warning"
          : "text-primary";

  let deltaNode: React.ReactNode = null;
  if (delta !== undefined && Number.isFinite(delta)) {
    const positive = delta >= 0;
    const good = goodDirection === "up" ? positive : !positive;
    const Icon = positive ? ArrowUpRight : ArrowDownRight;
    deltaNode = (
      <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", good ? "text-success" : "text-critical")}>
        <Icon className="size-3" />
        {Math.abs(delta * 100).toFixed(1)}%
      </span>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          {deltaNode}
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <div className={cn("mt-1 font-display text-3xl font-normal tabular-nums", accentClass)}>{value}</div>
        )}
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
