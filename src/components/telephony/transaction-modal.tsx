"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionPanel } from "./transaction-panel";

/** Floating "Transaction" modal — mirrors Homer's session_id/cid click-through. */
export function TransactionModal({
  callId,
  onOpenChange,
  onOpenMessage,
}: {
  callId: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenMessage?: (uuid: string) => void;
}) {
  return (
    <Dialog open={!!callId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">Transaction: {callId}</DialogTitle>
        </DialogHeader>
        {callId && <TransactionPanel callId={callId} onOpenMessage={onOpenMessage} />}
      </DialogContent>
    </Dialog>
  );
}
