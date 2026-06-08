import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CallEndReason, CallStatus, Disposition } from "@/lib/types";

const END_REASON_LABEL: Record<CallEndReason, string> = {
  USER_IDLE: "User idle",
  USER_DISCONNECTED: "User disconnected",
  CALL_TRANSFERRED: "Transferred",
  CALL_END_PHRASE_TRIGGERED: "End phrase",
  OTHER: "Other",
};

export function StatusChip({ status }: { status: CallStatus }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-success" />
        </span>
        Active
      </span>
    );
  }
  if (status === "FAILED") {
    return <Badge className="bg-critical/10 text-critical">Failed</Badge>;
  }
  return <Badge variant="secondary">Completed</Badge>;
}

export function EndReasonChip({ reason }: { reason: CallEndReason | null }) {
  if (!reason) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className="font-medium">
      {END_REASON_LABEL[reason]}
    </Badge>
  );
}

export function DispositionBadge({ disposition }: { disposition: Disposition }) {
  const map: Record<Disposition, string> = {
    completed: "text-success",
    transferred: "text-primary",
    voicemail: "text-warning",
    no_answer: "text-muted-foreground",
    failed: "text-critical",
  };
  return <span className={cn("text-xs font-medium capitalize", map[disposition])}>{disposition.replace("_", " ")}</span>;
}

export function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Live
    </span>
  );
}
