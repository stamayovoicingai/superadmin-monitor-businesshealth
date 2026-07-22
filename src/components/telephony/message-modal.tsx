"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSipMessagePayload } from "@/lib/hooks";
import { MethodBadge } from "./method-badge";

/** Quick-view of a single raw SIP message — mirrors Homer's "Message" modal. */
export function MessageModal({ uuid, onOpenChange }: { uuid: string | null; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useSipMessagePayload(uuid);
  const [decoded, setDecoded] = React.useState(false);

  return (
    <Dialog open={!!uuid} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">Message: {uuid}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <Field label="Timestamp" value={new Date(data.timestamp).toLocaleString()} />
              <Field label="Method" value={<MethodBadge method={data.method} />} />
              <Field label="Session ID" value={<span className="break-all font-mono">{data.sessionId}</span>} />
              <Field label="Src IP" value={data.srcIp} mono />
              <Field label="Src port" value={String(data.srcPort)} mono />
              <Field label="CID" value={<span className="break-all font-mono">{data.cid}</span>} />
              <Field label="Dst IP" value={data.dstIp} mono />
              <Field label="Dst port" value={String(data.dstPort)} mono />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payload</span>
                <Button variant="outline" size="xs" onClick={() => setDecoded((d) => !d)}>
                  {decoded ? "Raw" : "Decode"}
                </Button>
              </div>
              {decoded ? (
                <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border p-3 text-xs">
                  {Object.entries(data.headers).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
                      <span className="font-mono font-semibold text-muted-foreground">{k}</span>
                      <span className="break-all font-mono">{v}</span>
                    </div>
                  ))}
                  {data.sdp && (
                    <pre className="mt-2 whitespace-pre-wrap border-t pt-2 font-mono text-xs">{data.sdp}</pre>
                  )}
                </div>
              ) : (
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">{data.raw}</pre>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : "font-medium"}>{value}</div>
    </div>
  );
}
