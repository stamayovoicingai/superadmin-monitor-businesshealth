"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MessageSquare, Search, Waypoints } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTelephonyMessages } from "@/lib/hooks";
import { formatNumber } from "@/lib/money";
import { MethodBadge } from "@/components/telephony/method-badge";
import { MessageModal } from "@/components/telephony/message-modal";
import { TransactionModal } from "@/components/telephony/transaction-modal";

const ANY = "__any__";
const PAGE_SIZE = 50;
const METHODS = ["INVITE", "ACK", "BYE", "CANCEL", "OPTIONS", "100", "180", "200", "486", "487", "603"];

function fmtTs(ts: string) {
  const d = new Date(ts);
  return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export default function TelephonyPage() {
  const [page, setPage] = React.useState(1);
  const [sessionId, setSessionId] = React.useState("");
  const [caller, setCaller] = React.useState("");
  const [callee, setCallee] = React.useState("");
  const [method, setMethod] = React.useState<string>();
  const [srcIp, setSrcIp] = React.useState("");
  const [dstIp, setDstIp] = React.useState("");
  const [live, setLive] = React.useState(false);
  const [debounced, setDebounced] = React.useState({ sessionId: "", caller: "", callee: "", srcIp: "", dstIp: "" });

  const [messageUuid, setMessageUuid] = React.useState<string | null>(null);
  const [transactionId, setTransactionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced({ sessionId, caller, callee, srcIp, dstIp }), 300);
    return () => clearTimeout(t);
  }, [sessionId, caller, callee, srcIp, dstIp]);

  React.useEffect(() => setPage(1), [debounced, method]);

  const { data, isLoading } = useTelephonyMessages(
    { page, pageSize: PAGE_SIZE, ...debounced, method },
    live,
  );

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  let lastSessionId: string | null = null;
  let tint = false;

  return (
    <div>
      <PageHeader
        title="Telephony (SIP/RTP)"
        description="Raw SIP message capture — one row per message, matching the Homer trunk-observability Results Table."
      />

      <Card className="mb-3 py-0">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Session ID…" value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="h-8 w-40 pl-8 font-mono text-xs" />
          </div>
          <Input placeholder="Caller…" value={caller} onChange={(e) => setCaller(e.target.value)} className="h-8 w-32" />
          <Input placeholder="Callee…" value={callee} onChange={(e) => setCallee(e.target.value)} className="h-8 w-32" />
          <Select value={method ?? ANY} onValueChange={(v) => setMethod(v && v !== ANY ? v : undefined)}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any method</SelectItem>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Src IP…" value={srcIp} onChange={(e) => setSrcIp(e.target.value)} className="h-8 w-32 font-mono text-xs" />
          <Input placeholder="Dst IP…" value={dstIp} onChange={(e) => setDstIp(e.target.value)} className="h-8 w-32 font-mono text-xs" />
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={live} onCheckedChange={setLive} />
            Live
          </label>
          <span className="text-sm text-muted-foreground">{formatNumber(total)} messages</span>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Callee</TableHead>
                <TableHead>Src</TableHead>
                <TableHead>Dst</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 14 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : data!.rows.map((r) => {
                    if (r.sessionId !== lastSessionId) {
                      tint = !tint;
                      lastSessionId = r.sessionId;
                    }
                    return (
                      <TableRow key={r.uuid} className={tint ? "bg-muted/30" : undefined}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{fmtTs(r.timestamp)}</TableCell>
                        <TableCell>
                          <button className="cursor-pointer" onClick={() => setMessageUuid(r.uuid)}>
                            <MethodBadge method={r.method} />
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.caller}</TableCell>
                        <TableCell className="font-mono text-xs">{r.callee}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.srcAlias ?? r.srcIp}:{r.srcPort}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.dstAlias ?? r.dstIp}:{r.dstPort}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" title="Message" onClick={() => setMessageUuid(r.uuid)}>
                            <MessageSquare className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Transaction" onClick={() => setTransactionId(r.sessionId)}>
                            <Waypoints className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-3 flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          Page {page} of {pages}
        </span>
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <MessageModal uuid={messageUuid} onOpenChange={(open) => !open && setMessageUuid(null)} />
      <TransactionModal
        callId={transactionId}
        onOpenChange={(open) => !open && setTransactionId(null)}
        onOpenMessage={(uuid) => setMessageUuid(uuid)}
      />
    </div>
  );
}
