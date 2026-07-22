import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Color-codes a SIP method/response the way Homer's Results Table does (quick visual scan). */
export function methodClass(method: string): string {
  const code = Number(method);
  if (!Number.isNaN(code) && code >= 100) {
    if (code < 200) return "text-muted-foreground";
    if (code < 300) return "text-success";
    return "text-critical";
  }
  if (method === "INVITE") return "text-primary";
  if (method === "BYE" || method === "CANCEL") return "text-critical";
  return "text-muted-foreground";
}

export function MethodBadge({ method }: { method: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono font-semibold", methodClass(method))}>
      {method}
    </Badge>
  );
}
