"use client";

import * as React from "react";
import type { SipMessage } from "@/lib/types";

function isFailure(method: string) {
  const code = Number(method);
  return (code >= 400 && code < 700) || method === "CANCEL";
}
function isSuccess(method: string) {
  return method === "200" || method === "ACK";
}

/** Purpose-built SIP call-flow ladder: lanes derived from first-appearance order of src/dst addresses. */
export function SipFlowLadder({ messages }: { messages: SipMessage[] }) {
  const lanes = React.useMemo(() => {
    const seen: string[] = [];
    for (const m of messages) {
      if (!seen.includes(m.src)) seen.push(m.src);
      if (!seen.includes(m.dst)) seen.push(m.dst);
    }
    return seen;
  }, [messages]);

  const laneX = (addr: string) => {
    const i = lanes.indexOf(addr);
    return lanes.length <= 1 ? 50 : (i / (lanes.length - 1)) * 96 + 2;
  };

  if (messages.length === 0) return <p className="text-sm text-muted-foreground">No messages in this flow.</p>;

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(140px, 1fr))`, minWidth: lanes.length * 140 }}>
        {lanes.map((l) => (
          <div key={l} className="truncate rounded-md bg-muted px-2 py-1.5 text-center font-mono text-[11px] text-muted-foreground">
            {l}
          </div>
        ))}
      </div>

      <div className="relative mt-2" style={{ minWidth: lanes.length * 140 }}>
        {messages.map((m, i) => {
          const x1 = laneX(m.src);
          const x2 = laneX(m.dst);
          const color = isFailure(m.method) ? "var(--critical)" : isSuccess(m.method) ? "var(--success)" : "var(--primary)";
          const mid = (x1 + x2) / 2;
          return (
            <div key={m.seq} className="relative h-9">
              <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
                <line x1={x1} y1={12} x2={x2} y2={12} stroke={color} strokeWidth={0.5} />
                <polygon
                  points={
                    x2 >= x1
                      ? `${x2},12 ${x2 - 1.6},10.5 ${x2 - 1.6},13.5`
                      : `${x2},12 ${x2 + 1.6},10.5 ${x2 + 1.6},13.5`
                  }
                  fill={color}
                />
              </svg>
              <span
                className="absolute top-0 -translate-x-1/2 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-sm"
                style={{ left: `${mid}%`, color, borderColor: color }}
                title={`#${m.seq} · +${m.deltaMs}ms · ${m.src} → ${m.dst}`}
              >
                {m.method}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
