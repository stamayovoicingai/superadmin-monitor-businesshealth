"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, Lock, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { SeverityBadge } from "@/components/chips";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFlags, useUpdateFlag } from "@/lib/hooks";
import { useView } from "@/components/view-context";
import { canSeeOpsModules } from "@/lib/auth/policy";
import { formatNumber } from "@/lib/money";
import type { CallFlag, FlagStatus } from "@/lib/types";

const ANY = "__any__";
const STATUS_LABEL: Record<FlagStatus, string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export default function FlagQueuePage() {
  const { role } = useView();
  const { data, isLoading } = useFlags();
  const update = useUpdateFlag();
  const [status, setStatus] = React.useState<string>();
  const [source, setSource] = React.useState<string>();

  if (!canSeeOpsModules(role)) {
    return (
      <div>
        <PageHeader title="Flag Queue" description="Review flagged calls." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Lock className="size-6" /></div>
            <div className="text-lg font-semibold">Not available for your role</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const flags = data ?? [];
  const rows = flags.filter((f) => (!status || f.status === status) && (!source || f.source === source));
  const count = (pred: (f: CallFlag) => boolean) => flags.filter(pred).length;

  return (
    <div>
      <PageHeader
        title="Flag Queue"
        description="Unified review queue — manual flags and auto-flags from Issues/thresholds. Affected project is recorded on each flag."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Open" value={formatNumber(count((f) => f.status === "open"))} loading={isLoading} accent="orange" />
        <KpiCard label="In review" value={formatNumber(count((f) => f.status === "in_review"))} loading={isLoading} accent="violet" />
        <KpiCard label="Auto-flagged" value={formatNumber(count((f) => f.source === "auto"))} loading={isLoading} accent="blue" />
        <KpiCard label="Manual" value={formatNumber(count((f) => f.source === "manual"))} loading={isLoading} accent="green" />
      </div>

      <Card className="mt-4 mb-3 py-0">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <Select value={status ?? ANY} onValueChange={(v) => setStatus(v && v !== ANY ? v : undefined)}>
            <SelectTrigger size="sm" className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              {(Object.keys(STATUS_LABEL) as FlagStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={source ?? ANY} onValueChange={(v) => setSource(v && v !== ANY ? v : undefined)}>
            <SelectTrigger size="sm" className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any source</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">{formatNumber(rows.length)} flag(s)</span>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No flags match.</TableCell></TableRow>
              ) : (
                rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/calls/${f.callId}`} className="font-mono text-xs text-primary hover:underline">{f.callId}</Link>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{f.projectName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {f.source === "auto" ? <Bot className="size-3" /> : <User className="size-3" />}
                        {f.source}
                      </Badge>
                    </TableCell>
                    <TableCell>{f.severity ? <SeverityBadge severity={f.severity} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground" title={f.reason}>{f.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Select value={f.status} onValueChange={(v) => v && update.mutate({ id: f.id, status: v as FlagStatus }, { onSuccess: () => toast.success("Status updated") })}>
                        <SelectTrigger size="sm" className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABEL) as FlagStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CommentsButton flag={f} onAdd={(body) => update.mutate({ id: f.id, comment: body }, { onSuccess: () => toast.success("Comment added") })} />
                    </TableCell>
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

function CommentsButton({ flag, onAdd }: { flag: CallFlag; onAdd: (body: string) => void }) {
  const [body, setBody] = React.useState("");
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
        <MessageSquare className="size-3.5 text-muted-foreground" />
        {flag.comments.length > 0 && <span className="ml-0.5 text-[10px]">{flag.comments.length}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-2">
        <div className="text-sm font-semibold">Notes</div>
        <div className="max-h-40 space-y-1.5 overflow-auto">
          {flag.comments.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
          {flag.comments.map((c, i) => (
            <div key={i} className="rounded-md bg-muted px-2 py-1.5 text-xs">
              <div>{c.body}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{c.author} · {new Date(c.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="w-full rounded-md border bg-transparent p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <Button size="sm" className="w-full" disabled={!body.trim()} onClick={() => { onAdd(body.trim()); setBody(""); }}>
          Add note
        </Button>
      </PopoverContent>
    </Popover>
  );
}
