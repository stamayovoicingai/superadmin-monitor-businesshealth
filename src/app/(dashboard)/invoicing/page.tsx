"use client";

import * as React from "react";
import { Download, Lock, Mail, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useView } from "@/components/view-context";
import { canSeeFinancials } from "@/lib/auth/policy";
import {
  useAddDowntimeExclusion,
  useDeleteDowntimeExclusion,
  useInvoicePreview,
  useInvoiceRuns,
  useInvoiceScopeState,
  useMeta,
  useSaveInvoiceConfig,
  useSendInvoiceNow,
} from "@/lib/hooks";
import { DEFAULT_INVOICE_BODY, DEFAULT_INVOICE_SUBJECT, INVOICE_COLUMNS, INVOICE_TIMEZONES } from "@/lib/invoicing";
import { formatNumber } from "@/lib/money";
import type { InvoiceColumnKey, InvoiceConfig, InvoiceFrequency, InvoiceScopeType } from "@/lib/types";

const FREQUENCY_LABELS: Record<InvoiceFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  custom_days: "Every N days",
};

export default function InvoicingPage() {
  const { role, orgId, projectId } = useView();
  const { data: meta } = useMeta();

  if (!canSeeFinancials(role)) {
    return (
      <div>
        <PageHeader title="Invoicing" description="Automated usage export & client invoice scheduling." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Lock className="size-6" />
            </div>
            <div className="text-lg font-semibold">Not available for your role</div>
            <p className="max-w-md text-sm text-muted-foreground">Invoicing is restricted to SuperAdmin, PM, and Financial.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopeType: InvoiceScopeType | null = projectId ? "project" : orgId ? "org" : null;
  const scopeId = projectId ?? orgId ?? null;
  const orgName = meta?.orgs.find((o) => o.id === orgId)?.name;
  const projectName = meta?.projects.find((p) => p.id === projectId)?.name;
  const scopeLabel = projectId ? `${projectName} (project)` : orgId ? `${orgName} (organization)` : null;

  const { data: scopeState, isLoading } = useInvoiceScopeState();
  const effectiveConfig = scopeState?.own ?? scopeState?.inherited ?? null;
  const usingInherited = !!scopeState?.inherited && !scopeState?.own;

  return (
    <div>
      <PageHeader
        title="Invoicing"
        description="Configure automated usage exports per client — recipients, schedule, columns, and exclusions."
      />

      {!scopeType ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Select an <span className="font-medium text-foreground">organization</span> or{" "}
            <span className="font-medium text-foreground">project</span> in the top bar to configure its invoicing.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Managing invoicing for</span>
            <Badge variant="secondary" className="font-semibold">{scopeLabel}</Badge>
            {usingInherited && <span className="text-muted-foreground">· using the organization's default config</span>}
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              <ConfigCard scopeType={scopeType} scopeId={scopeId!} initial={scopeState?.own ?? null} inherited={scopeState?.inherited ?? null} />
              {effectiveConfig && (
                <>
                  <ExclusionsCard
                    scopeType={scopeType}
                    scopeId={scopeId!}
                    config={scopeState!.own}
                    downtimeOwn={scopeState?.downtimeOwn ?? []}
                    downtimeInherited={scopeState?.downtimeInherited ?? []}
                  />
                  <PreviewSendCard />
                  <HistoryCard />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConfigCard({
  scopeType,
  scopeId,
  initial,
  inherited,
}: {
  scopeType: InvoiceScopeType;
  scopeId: string;
  initial: InvoiceConfig | null;
  inherited: InvoiceConfig | null;
}) {
  const base = initial ?? inherited;
  const [recipients, setRecipients] = React.useState((base?.recipients ?? []).join(", "));
  const [frequency, setFrequency] = React.useState<InvoiceFrequency>(base?.frequency ?? "monthly");
  const [frequencyDays, setFrequencyDays] = React.useState(base?.frequencyDays ?? 30);
  const [timezone, setTimezone] = React.useState(base?.timezone ?? "UTC");
  const [subject, setSubject] = React.useState(base?.emailSubject ?? DEFAULT_INVOICE_SUBJECT);
  const [body, setBody] = React.useState(base?.emailBody ?? DEFAULT_INVOICE_BODY);
  const [columns, setColumns] = React.useState<Set<InvoiceColumnKey>>(new Set(base?.columns ?? INVOICE_COLUMNS.map((c) => c.key)));
  const [active, setActive] = React.useState(base?.active ?? true);
  const save = useSaveInvoiceConfig();

  const toggleColumn = (key: InvoiceColumnKey) => {
    const next = new Set(columns);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setColumns(next);
  };

  const recipientList = recipients.split(",").map((r) => r.trim()).filter(Boolean);
  const canSave = recipientList.length > 0 && columns.size > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Invoice configuration" : inherited ? "Override the organization's default" : "Set up invoicing"}</CardTitle>
        <CardDescription>Recipients, schedule, and the email that goes out with each export.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipients</label>
          <Input placeholder="billing@client.com, ops@voicing.ai" value={recipients} onChange={(e) => setRecipients(e.target.value)} className="h-8" />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Frequency</label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as InvoiceFrequency)}>
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FREQUENCY_LABELS) as InvoiceFrequency[]).map((f) => (
                  <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {frequency === "custom_days" && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Every N days</label>
              <Input type="number" min={1} value={frequencyDays} onChange={(e) => setFrequencyDays(Math.max(1, Number(e.target.value)))} className="h-8 w-20" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timezone</label>
            <Select value={timezone} onValueChange={(v) => setTimezone(v ?? "UTC")}>
              <SelectTrigger size="sm" className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={active} onCheckedChange={setActive} />
            Active
          </label>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachment columns</label>
          <div className="flex flex-wrap gap-3">
            {INVOICE_COLUMNS.map((c) => (
              <label key={c.key} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" className="size-4" checked={columns.has(c.key)} onChange={() => toggleColumn(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-md border bg-transparent p-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Variables: <code>{"{{org_name}}"}</code> <code>{"{{project_name}}"}</code> <code>{"{{period_start}}"}</code>{" "}
              <code>{"{{period_end}}"}</code> <code>{"{{call_count}}"}</code> <code>{"{{total_minutes}}"}</code>
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={!canSave}
          onClick={() =>
            save.mutate(
              {
                scopeType,
                scopeId,
                recipients: recipientList,
                frequency,
                frequencyDays: frequency === "custom_days" ? frequencyDays : undefined,
                timezone,
                emailSubject: subject,
                emailBody: body,
                columns: Array.from(columns),
                excludeCallerIds: initial?.excludeCallerIds ?? [],
                excludeCallIds: initial?.excludeCallIds ?? [],
                active,
              },
              { onSuccess: () => toast.success("Invoice config saved") },
            )
          }
        >
          {initial ? "Save changes" : "Save configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ExclusionsCard({
  scopeType,
  scopeId,
  config,
  downtimeOwn,
  downtimeInherited,
}: {
  scopeType: InvoiceScopeType;
  scopeId: string;
  config: InvoiceConfig | null;
  downtimeOwn: { id: string; from: string; to: string; reason: string }[];
  downtimeInherited: { id: string; from: string; to: string; reason: string }[];
}) {
  const save = useSaveInvoiceConfig();
  const addDowntime = useAddDowntimeExclusion();
  const deleteDowntime = useDeleteDowntimeExclusion();
  const [callerId, setCallerId] = React.useState("");
  const [callId, setCallId] = React.useState("");
  const [dtFrom, setDtFrom] = React.useState("");
  const [dtTo, setDtTo] = React.useState("");
  const [dtReason, setDtReason] = React.useState("");

  if (!config) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Save a configuration for this exact scope first to manage its own test-caller and downtime exclusions
          (you're currently viewing the organization's inherited config, read-only).
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exclusions</CardTitle>
        <CardDescription>Test traffic and downtime windows never get invoiced.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Excluded caller IDs (test traffic)</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {config.excludeCallerIds.map((id) => (
                <Badge key={id} variant="outline" className="gap-1 font-mono text-[10px]">
                  {id}
                  <button
                    onClick={() =>
                      save.mutate({ ...configInput(config), excludeCallerIds: config.excludeCallerIds.filter((x) => x !== id) })
                    }
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {config.excludeCallerIds.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="caller hash…" value={callerId} onChange={(e) => setCallerId(e.target.value)} className="h-7 font-mono text-xs" />
              <Button
                size="xs"
                variant="outline"
                disabled={!callerId.trim()}
                onClick={() => {
                  save.mutate({ ...configInput(config), excludeCallerIds: [...config.excludeCallerIds, callerId.trim()] });
                  setCallerId("");
                }}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Excluded call IDs</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {config.excludeCallIds.map((id) => (
                <Badge key={id} variant="outline" className="gap-1 font-mono text-[10px]">
                  {id}
                  <button onClick={() => save.mutate({ ...configInput(config), excludeCallIds: config.excludeCallIds.filter((x) => x !== id) })}>×</button>
                </Badge>
              ))}
              {config.excludeCallIds.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="call_id…" value={callId} onChange={(e) => setCallId(e.target.value)} className="h-7 font-mono text-xs" />
              <Button
                size="xs"
                variant="outline"
                disabled={!callId.trim()}
                onClick={() => {
                  save.mutate({ ...configInput(config), excludeCallIds: [...config.excludeCallIds, callId.trim()] });
                  setCallId("");
                }}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Downtime exclusion windows</div>
          <div className="mb-2 space-y-1.5">
            {downtimeInherited.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">inherited</Badge>
                {new Date(d.from).toLocaleString()} → {new Date(d.to).toLocaleString()} · {d.reason}
              </div>
            ))}
            {downtimeOwn.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                {new Date(d.from).toLocaleString()} → {new Date(d.to).toLocaleString()} · {d.reason}
                <Button variant="ghost" size="icon" className="ml-auto size-6" onClick={() => deleteDowntime.mutate(d.id)}>
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
            {downtimeOwn.length === 0 && downtimeInherited.length === 0 && <p className="text-xs text-muted-foreground">No downtime windows excluded.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="datetime-local" value={dtFrom} onChange={(e) => setDtFrom(e.target.value)} className="h-7 w-48 text-xs" />
            <Input type="datetime-local" value={dtTo} onChange={(e) => setDtTo(e.target.value)} className="h-7 w-48 text-xs" />
            <Input placeholder="Reason (e.g. STT outage)" value={dtReason} onChange={(e) => setDtReason(e.target.value)} className="h-7 w-56 text-xs" />
            <Button
              size="xs"
              variant="outline"
              disabled={!dtFrom || !dtTo}
              onClick={() => {
                addDowntime.mutate(
                  { scopeType, scopeId, from: new Date(dtFrom).toISOString(), to: new Date(dtTo).toISOString(), reason: dtReason },
                  {
                    onSuccess: () => {
                      toast.success("Downtime window excluded");
                      setDtFrom("");
                      setDtTo("");
                      setDtReason("");
                    },
                  },
                );
              }}
            >
              <Plus className="size-3" /> Exclude window
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function configInput(c: InvoiceConfig) {
  return {
    scopeType: c.scopeType,
    scopeId: c.scopeId,
    recipients: c.recipients,
    frequency: c.frequency,
    frequencyDays: c.frequencyDays,
    timezone: c.timezone,
    emailSubject: c.emailSubject,
    emailBody: c.emailBody,
    columns: c.columns,
    excludeCallerIds: c.excludeCallerIds,
    excludeCallIds: c.excludeCallIds,
    active: c.active,
  };
}

function PreviewSendCard() {
  const { orgId, projectId } = useView();
  const [period, setPeriod] = React.useState<{ from: string; to: string } | undefined>(undefined);
  const { data: preview, isLoading, isError } = useInvoicePreview(period);
  const send = useSendInvoiceNow();

  const exportQs = (p?: { from: string; to: string }) => {
    const sp = new URLSearchParams();
    if (orgId) sp.set("orgId", orgId);
    if (projectId) sp.set("projectId", projectId);
    if (p?.from) sp.set("from", p.from);
    if (p?.to) sp.set("to", p.to);
    return sp.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview & send</CardTitle>
        <CardDescription>
          {preview ? `Period: ${new Date(preview.periodFrom).toLocaleDateString()} – ${new Date(preview.periodTo).toLocaleDateString()} (${preview.timezone})` : "Defaults to the last completed period for this schedule."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            onChange={(e) => setPeriod((p) => ({ from: e.target.value ? new Date(e.target.value).toISOString() : (p?.from ?? ""), to: p?.to ?? "" }))}
            className="h-8 w-40"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            onChange={(e) => setPeriod((p) => ({ from: p?.from ?? "", to: e.target.value ? new Date(e.target.value).toISOString() : (p?.to ?? "") }))}
            className="h-8 w-40"
          />
          {period && (
            <Button variant="ghost" size="sm" onClick={() => setPeriod(undefined)}>
              Reset to default period
            </Button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError || !preview ? (
          <p className="text-sm text-muted-foreground">No data for this period yet.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Calls" value={formatNumber(preview.totalCalls)} />
              <Stat label="Minutes" value={formatNumber(preview.totalMinutes)} />
              <Stat label="Excluded (test)" value={formatNumber(preview.excludedTestCalls)} />
              <Stat label="Excluded (downtime)" value={formatNumber(preview.excludedDowntimeCalls)} />
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Mail className="size-3.5" /> Email preview
              </div>
              <p className="text-sm font-semibold">{preview.emailSubject}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{preview.emailBody}</p>
              <p className="mt-2 text-xs text-muted-foreground">To: {preview.recipients.join(", ")}</p>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {preview.columns.map((c) => (
                      <TableHead key={c.key}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {preview.columns.map((c) => (
                        <TableCell key={c.key} className="font-mono text-xs">{String(row[c.key])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.totalCalls > 10 && (
                <p className="p-2 text-center text-xs text-muted-foreground">Showing 10 of {formatNumber(preview.totalCalls)} rows — download the CSV for the full export.</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">Next scheduled run: {new Date(preview.nextRun).toLocaleString()}</p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<a href={`/api/invoicing/export?${exportQs(period)}`} download />}
              >
                <Download className="size-4" /> Download CSV
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  send.mutate(period, {
                    onSuccess: () => toast.success("Invoice sent (simulated — no real email provider wired up yet)"),
                    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
                  })
                }
              >
                <Send className="size-4" /> Send now
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

function HistoryCard() {
  const { orgId, projectId } = useView();
  const { data: runs, isLoading } = useInvoiceRuns();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice history</CardTitle>
        <CardDescription>Past runs for this scope — simulated sends, since no email provider is wired up yet.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !runs || runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices sent yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Minutes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Export</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.periodFrom).toLocaleDateString()} – {new Date(r.periodTo).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.recipients.join(", ")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.callCount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.totalMinutes)}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.sentAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      render={
                        <a
                          href={`/api/invoicing/export?${new URLSearchParams({
                            ...(orgId ? { orgId } : {}),
                            ...(projectId ? { projectId } : {}),
                            from: r.periodFrom,
                            to: r.periodTo,
                          })}`}
                          download
                        />
                      }
                    >
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
