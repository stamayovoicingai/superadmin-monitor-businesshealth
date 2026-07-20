"use client";

import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFallbacks, useUpdateFallback } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { canSeeOpsModules } from "@/lib/auth/policy";
import { FALLBACK_OPTIONS, FALLBACK_PRIMARY, FALLBACK_SERVICE_LABEL, llmCostLabel } from "@/lib/engine/fallbacks";
import type { FallbackScopeType, FallbackService } from "@/lib/types";
import type { ServiceFallback } from "@/lib/data/source";

export default function FallbacksPage() {
  const { role, orgId, projectId } = useView();
  const { data, isLoading } = useFallbacks();
  const update = useUpdateFallback();

  if (!canSeeOpsModules(role)) {
    return (
      <div>
        <PageHeader title="Fallback Controls" description="Provider fallback for STT / TTS / LLM." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Lock className="size-6" />
            </div>
            <div className="text-lg font-semibold">Not available for your role</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopeType: FallbackScopeType = projectId ? "project" : orgId ? "org" : "global";
  const scopeId = projectId ?? orgId ?? null;

  function patch(service: FallbackService, patch: { enabled?: boolean; fallbackModel?: string; orderedModels?: string[] }) {
    update.mutate(
      { service, scopeType, scopeId, ...patch },
      { onSuccess: () => toast.success("Fallback updated"), onError: () => toast.error("Update failed") },
    );
  }

  const byService = (s: FallbackService): ServiceFallback | undefined =>
    data?.services.find((x) => x.service === s);

  return (
    <div>
      <PageHeader
        title="Fallback Controls"
        description="Define provider fallbacks when the primary fails (per-call error/timeout) or a provider has an outage."
      />

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Applies to</span>
        <Badge variant="secondary" className="font-semibold">{data?.scopeLabel ?? "All orgs"}</Badge>
        <span className="text-muted-foreground">· change the Org/Project filter to scope an override</span>
      </div>

      <Tabs defaultValue="stt">
        <TabsList>
          <TabsTrigger value="stt">STT</TabsTrigger>
          <TabsTrigger value="tts">TTS</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
        </TabsList>

        {(["stt", "tts"] as const).map((svc) => (
          <TabsContent key={svc} value={svc}>
            <SingleFallbackCard service={svc} sf={byService(svc)} loading={isLoading} onPatch={patch} />
          </TabsContent>
        ))}

        <TabsContent value="llm">
          <LlmFallbackCard sf={byService("llm")} loading={isLoading} onPatch={patch} />
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Recent fallback activity</CardTitle>
          <CardDescription>When the platform switched provider due to a failure</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Switch</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              ) : (
                data!.events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="uppercase">{e.service}</TableCell>
                    <TableCell>{e.scopeLabel}</TableCell>
                    <TableCell className="font-mono text-xs">{e.fromModel} → {e.toModel}</TableCell>
                    <TableCell className="text-muted-foreground">{e.reason}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ScopeBadge({ sf }: { sf?: ServiceFallback }) {
  if (!sf) return null;
  return sf.isOverride ? (
    <Badge variant="outline" className="text-primary">scope override</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">inherited from All orgs</Badge>
  );
}

function SingleFallbackCard({
  service,
  sf,
  loading,
  onPatch,
}: {
  service: FallbackService;
  sf?: ServiceFallback;
  loading: boolean;
  onPatch: (s: FallbackService, p: { enabled?: boolean; fallbackModel?: string }) => void;
}) {
  if (loading || !sf) return <Skeleton className="h-48 w-full" />;
  const options = FALLBACK_OPTIONS[service].filter((m) => m !== FALLBACK_PRIMARY[service]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {FALLBACK_SERVICE_LABEL[service]} fallback
          <ScopeBadge sf={sf} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{sf.config.enabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={sf.config.enabled} onCheckedChange={(v) => onPatch(service, { enabled: v })} />
          </div>
        </CardTitle>
        <CardDescription>Single fallback model used when the primary fails or times out.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-6">
        <div>
          <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Primary (platform default)</div>
          <Badge variant="secondary" className="font-mono">{FALLBACK_PRIMARY[service]}</Badge>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Fallback model</div>
          <Select value={sf.config.fallbackModel} onValueChange={(v) => v && onPatch(service, { fallbackModel: v })}>
            <SelectTrigger size="sm" className="w-48 font-mono">
              <SelectValue placeholder="Choose fallback" />
            </SelectTrigger>
            <SelectContent>
              {options.map((m) => (
                <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function LlmFallbackCard({
  sf,
  loading,
  onPatch,
}: {
  sf?: ServiceFallback;
  loading: boolean;
  onPatch: (s: FallbackService, p: { enabled?: boolean; orderedModels?: string[] }) => void;
}) {
  if (loading || !sf) return <Skeleton className="h-64 w-full" />;
  const list = sf.config.orderedModels ?? [];
  const remaining = FALLBACK_OPTIONS.llm.filter((m) => !list.includes(m));

  const reorder = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onPatch("llm", { orderedModels: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          LLM fallback — cost-ordered list
          <ScopeBadge sf={sf} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{sf.config.enabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={sf.config.enabled} onCheckedChange={(v) => onPatch("llm", { enabled: v })} />
          </div>
        </CardTitle>
        <CardDescription>
          Tried top-to-bottom on failure. The platform respects this order (it does not auto-pick the cheapest live).
          Scope: bot-conversation LLM (MVP).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.map((m, i) => (
          <div key={m} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
            <span className="font-mono text-sm">{m}</span>
            <span className="text-xs text-muted-foreground">{llmCostLabel(m)}</span>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" disabled={i === 0} onClick={() => reorder(i, -1)}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" disabled={i === list.length - 1} onClick={() => reorder(i, 1)}>
                <ArrowDown className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onPatch("llm", { orderedModels: list.filter((x) => x !== m) })}>
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}

        {remaining.length > 0 && (
          <div className="flex items-center gap-2 border-t pt-3">
            <Select onValueChange={(v) => typeof v === "string" && v && onPatch("llm", { orderedModels: [...list, v] })}>
              <SelectTrigger size="sm" className="w-56 font-mono">
                <SelectValue placeholder="Add model to list…" />
              </SelectTrigger>
              <SelectContent>
                {remaining.map((m) => (
                  <SelectItem key={m} value={m} className="font-mono">{m} · {llmCostLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground"><Plus className="mr-1 inline size-3" />append to fallback chain</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
