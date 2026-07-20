"use client";

import * as React from "react";
import { Check, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateCategory, useCreateThreshold, useDeleteThreshold, useMeta, useThresholds, useUpdateThreshold } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { canSeeOpsModules } from "@/lib/auth/policy";
import { ABANDONMENT_REASONS, ISSUE_METRICS } from "@/lib/engine/issues";
import { cn } from "@/lib/utils";
import type { CallEndReason, IssueCategory, Threshold, ThresholdMetric } from "@/lib/types";

const METRIC_KEYS = Object.keys(ISSUE_METRICS) as ThresholdMetric[];

export default function ThresholdsPage() {
  const { role, orgId, projectId } = useView();
  const { data: meta } = useMeta();
  const { data, isLoading } = useThresholds();
  const create = useCreateThreshold();
  const update = useUpdateThreshold();
  const del = useDeleteThreshold();
  const createCat = useCreateCategory();

  const [newMetric, setNewMetric] = React.useState<ThresholdMetric>("latency_ms");
  const [newCat, setNewCat] = React.useState("");
  const [catName, setCatName] = React.useState("");

  if (!canSeeOpsModules(role)) {
    return (
      <div>
        <PageHeader title="Thresholds" description="Configure Critical/Warning thresholds." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Lock className="size-6" /></div>
            <div className="text-lg font-semibold">Not available for your role</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = data?.categories ?? [];
  const scopeType = projectId ? "project" : orgId ? "org" : "global";
  const scopeId = projectId ?? orgId ?? null;
  const scopeLabel = projectId
    ? meta?.projects.find((p) => p.id === projectId)?.name
    : orgId
      ? meta?.orgs.find((o) => o.id === orgId)?.name
      : "All orgs";

  const thresholdScopeLabel = (t: Threshold) =>
    t.scopeType === "global"
      ? "All orgs"
      : t.scopeType === "org"
        ? meta?.orgs.find((o) => o.id === t.scopeId)?.name ?? "org"
        : meta?.projects.find((p) => p.id === t.scopeId)?.name ?? "project";

  function addThreshold() {
    const d = ISSUE_METRICS[newMetric].defaults;
    create.mutate(
      {
        metric: newMetric,
        scopeType,
        scopeId,
        warning: d.warning,
        critical: d.critical,
        categoryId: newCat || categories[0]?.id || "cat-technical",
        enabled: true,
        reasons: newMetric === "abandonment_rate" ? ["USER_DISCONNECTED", "USER_IDLE"] : undefined,
      },
      { onSuccess: () => toast.success("Threshold added") },
    );
  }

  return (
    <div>
      <PageHeader
        title="Thresholds"
        description="Define Critical/Warning thresholds that drive Issues. Critical breaches auto-flag affected calls."
      />

      {/* Categories */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Issue categories</CardTitle>
          <CardDescription>Used to classify thresholds &amp; issues</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <Badge key={c.id} variant="secondary">{c.name}</Badge>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="New category" className="h-8 w-40" />
            <Button
              size="sm"
              variant="outline"
              disabled={!catName.trim()}
              onClick={() => createCat.mutate(catName.trim(), { onSuccess: () => { toast.success("Category created"); setCatName(""); } })}
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add threshold */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Add threshold</CardTitle>
          <CardDescription>Applies to <span className="font-medium text-foreground">{scopeLabel}</span> (change via the Org/Project filter)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Metric</div>
            <Select value={newMetric} onValueChange={(v) => v && setNewMetric(v as ThresholdMetric)}>
              <SelectTrigger size="sm" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METRIC_KEYS.map((m) => (
                  <SelectItem key={m} value={m}>{ISSUE_METRICS[m].label} ({ISSUE_METRICS[m].comparator === "gt" ? ">" : "<"} {ISSUE_METRICS[m].unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Category</div>
            <Select value={newCat || categories[0]?.id || ""} onValueChange={(v) => v && setNewCat(v)}>
              <SelectTrigger size="sm" className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={addThreshold}><Plus className="size-4" /> Add threshold</Button>
        </CardContent>
      </Card>

      {/* Thresholds table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Warning</TableHead>
                <TableHead className="text-right">Critical</TableHead>
                <TableHead>Reasons</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              ) : (
                data!.thresholds.map((t) => (
                  <ThresholdRow
                    key={t.id}
                    t={t}
                    categories={categories}
                    scopeLabel={thresholdScopeLabel(t)}
                    onUpdate={(patch) => update.mutate({ id: t.id, ...patch })}
                    onDelete={() => del.mutate(t.id, { onSuccess: () => toast.success("Threshold removed") })}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ThresholdRow({
  t,
  categories,
  scopeLabel,
  onUpdate,
  onDelete,
}: {
  t: Threshold;
  categories: IssueCategory[];
  scopeLabel: string;
  onUpdate: (patch: { warning?: number; critical?: number; enabled?: boolean; categoryId?: string; reasons?: CallEndReason[] }) => void;
  onDelete: () => void;
}) {
  const meta = ISSUE_METRICS[t.metric];
  const [warning, setWarning] = React.useState(String(t.warning));
  const [critical, setCritical] = React.useState(String(t.critical));
  React.useEffect(() => { setWarning(String(t.warning)); setCritical(String(t.critical)); }, [t.warning, t.critical]);

  const reasons = new Set(t.reasons ?? []);
  const toggleReason = (r: CallEndReason) => {
    const next = new Set(reasons);
    if (next.has(r)) next.delete(r); else next.add(r);
    onUpdate({ reasons: [...next] });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{meta.label}</div>
        <div className="text-[11px] text-muted-foreground">{meta.comparator === "gt" ? "greater than" : "less than"} · {meta.unit}</div>
      </TableCell>
      <TableCell><Badge variant="secondary" className="font-mono text-[10px]">{scopeLabel}</Badge></TableCell>
      <TableCell>
        <Select value={t.categoryId} onValueChange={(v) => v && onUpdate({ categoryId: v })}>
          <SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Input
          value={warning}
          onChange={(e) => setWarning(e.target.value)}
          onBlur={() => Number(warning) !== t.warning && onUpdate({ warning: Number(warning) })}
          className="h-8 w-20 text-right tabular-nums"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          value={critical}
          onChange={(e) => setCritical(e.target.value)}
          onBlur={() => Number(critical) !== t.critical && onUpdate({ critical: Number(critical) })}
          className="h-8 w-20 text-right tabular-nums"
        />
      </TableCell>
      <TableCell>
        {t.metric === "abandonment_rate" ? (
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" />}>
              {reasons.size} reason(s)
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64">
              <div className="space-y-1">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Count as abandonment</div>
                {ABANDONMENT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => toggleReason(r.value)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className={cn("flex size-4 items-center justify-center rounded border", reasons.has(r.value) ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                      {reasons.has(r.value) && <Check className="size-3" />}
                    </span>
                    {r.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell><Switch checked={t.enabled} onCheckedChange={(v) => onUpdate({ enabled: v })} /></TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="size-7" onClick={onDelete}><Trash2 className="size-3.5 text-muted-foreground" /></Button>
      </TableCell>
    </TableRow>
  );
}
