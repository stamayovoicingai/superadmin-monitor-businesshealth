"use client";

import * as React from "react";
import { AlertTriangle, Bell, Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { LiveDot } from "@/components/chips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useHealth, useMeta, useSetRecipients, useSetServiceOverride } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { cn } from "@/lib/utils";
import type { HealthService, ServiceStatus } from "@/lib/types";

const STATUS_STYLE: Record<ServiceStatus, { dot: string; text: string; label: string }> = {
  operational: { dot: "bg-success", text: "text-success", label: "Operational" },
  degraded: { dot: "bg-warning", text: "text-warning", label: "Degraded" },
  down: { dot: "bg-critical", text: "text-critical", label: "Down" },
  maintenance: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Maintenance" },
};

function HeartbeatBar({ beats }: { beats: ServiceStatus[] }) {
  return (
    <div className="flex items-end gap-[2px]">
      {beats.map((b, i) => (
        <span key={i} className={cn("h-5 w-[3px] rounded-sm", STATUS_STYLE[b].dot)} title={STATUS_STYLE[b].label} />
      ))}
    </div>
  );
}

function ServiceRow({ s }: { s: HealthService }) {
  const setOverride = useSetServiceOverride();
  const [emails, setEmails] = React.useState("");
  const st = STATUS_STYLE[s.status];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
      <span className={cn("size-2 shrink-0 rounded-full", st.dot)} />
      <div className="min-w-[160px]">
        <div className="text-sm font-medium">{s.name}</div>
        <div className="text-[11px] text-muted-foreground">{s.category}</div>
      </div>
      <Badge variant="outline" className={cn("font-medium", st.text)}>{st.label}</Badge>
      <div className="hidden sm:block"><HeartbeatBar beats={s.heartbeats.slice(-30)} /></div>
      <div className="ml-auto flex items-center gap-4 text-sm tabular-nums">
        <span className="text-muted-foreground" title="Uptime 30d">{s.uptimePct}%</span>
        <span className="text-muted-foreground" title="Response time">{s.responseMs} ms</span>
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
            <Bell className="size-3.5 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="space-y-2">
              <div className="text-sm font-semibold">Notify override</div>
              <p className="text-xs text-muted-foreground">Comma-separated emails alerted for this service (overrides the project list).</p>
              <Input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="a@x.com, b@y.com" className="h-8" />
              <Button
                size="sm"
                className="w-full"
                onClick={() =>
                  setOverride.mutate(
                    { serviceId: s.id, emails: emails.split(",").map((x) => x.trim()).filter(Boolean) },
                    { onSuccess: () => toast.success("Override saved") },
                  )
                }
              >
                Save override
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function RecipientsEditor({ projectId, emails }: { projectId: string; emails: string[] }) {
  const setRecipients = useSetRecipients();
  const [input, setInput] = React.useState("");

  const add = () => {
    const e = input.trim();
    if (!e) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      toast.error("Enter a valid email");
      return;
    }
    if (emails.includes(e)) return;
    setRecipients.mutate({ scopeId: projectId, emails: [...emails, e] }, { onSuccess: () => setInput("") });
  };
  const remove = (e: string) => setRecipients.mutate({ scopeId: projectId, emails: emails.filter((x) => x !== e) });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {emails.length === 0 && <span className="text-sm text-muted-foreground">No recipients yet.</span>}
        {emails.map((e) => (
          <Badge key={e} variant="secondary" className="gap-1">
            <Mail className="size-3" />
            {e}
            <button onClick={() => remove(e)} className="ml-1 hover:text-critical" aria-label={`Remove ${e}`}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="ops@client.com"
          className="h-8 w-64"
        />
        <Button size="sm" onClick={add}><Plus className="size-4" /> Add</Button>
      </div>
      <p className="text-xs text-muted-foreground">Recipients are notified on <b>degraded</b>, <b>down</b> and <b>recovery</b>, including which projects were affected.</p>
    </div>
  );
}

export default function HealthPage() {
  const { orgId, projectId } = useView();
  const { data: meta } = useMeta();
  const { data, isLoading, dataUpdatedAt } = useHealth();

  const external = data?.services.filter((s) => s.kind === "external") ?? [];
  const internal = data?.services.filter((s) => s.kind === "internal") ?? [];
  const projectName = meta?.projects.find((p) => p.id === projectId)?.name;
  const showInternal = !!(orgId || projectId);

  return (
    <div>
      <PageHeader
        title="Service Health"
        description="Health of external dependencies and internal services for platform.voicing.ai. Refreshes every 30s."
        actions={
          <div className="flex items-center gap-3">
            <LiveDot />
            {dataUpdatedAt > 0 && <span className="text-xs text-muted-foreground">checked {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Operational" value={data ? data.summary.operational : "—"} loading={isLoading} accent="green" />
        <KpiCard label="Degraded" value={data ? data.summary.degraded : "—"} loading={isLoading} accent="orange" goodDirection="down" />
        <KpiCard label="Down" value={data ? data.summary.down : "—"} loading={isLoading} accent="orange" goodDirection="down" />
        <KpiCard label="Incidents" value={data ? data.incidents.length : "—"} loading={isLoading} accent="violet" goodDirection="down" />
      </div>

      {data && data.incidents.length > 0 && (
        <Card className="mt-4 border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warning" /> Active incidents
            </CardTitle>
            <CardDescription>Affected projects are listed so the right teams get notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.incidents.map((i) => (
              <div key={i.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("size-2 rounded-full", STATUS_STYLE[i.status].dot)} />
                  <span className="font-medium">{i.serviceName}</span>
                  <Badge variant="outline" className={STATUS_STYLE[i.status].text}>{STATUS_STYLE[i.status].label}</Badge>
                  <span className="text-xs text-muted-foreground">since {new Date(i.startedAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Affected projects:</span>
                  {i.affectedProjects.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">External dependencies</CardTitle>
          <CardDescription>Shared provider services (LLM / STT / TTS / telephony / cloud)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <Skeleton className="h-24 w-full" /> : external.map((s) => <ServiceRow key={s.id} s={s} />)}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Internal services</CardTitle>
          <CardDescription>
            {projectId ? `${projectName} services` : orgId ? "Services across this org's projects" : "Select an org or project to see internal services"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!showInternal ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Pick a project (or org) in the top bar.</p>
          ) : isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : internal.length === 0 ? (
            <p className="text-sm text-muted-foreground">No internal services in scope.</p>
          ) : (
            internal.map((s) => <ServiceRow key={s.id} s={s} />)
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Notification recipients</CardTitle>
          <CardDescription>Per-project email list for health alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {projectId ? (
            <RecipientsEditor projectId={projectId} emails={data?.recipients ?? []} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a project in the top bar to manage its notification recipients.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
