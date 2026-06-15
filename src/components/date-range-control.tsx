"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANGE_LABELS, RANGE_PRESETS, rangeLabel, resolveRangeState, type RangeState } from "@/lib/period";

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (local: string): string => new Date(local).toISOString();

export function DateRangeControl({
  value,
  onChange,
  size = "sm",
}: {
  value: RangeState;
  onChange: (v: RangeState) => void;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  React.useEffect(() => {
    if (open) {
      const r = resolveRangeState(value);
      setFrom(toLocalInput(value.from ?? r.from));
      setTo(toLocalInput(value.to ?? r.to));
    }
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size={size} className="gap-1.5" />}>
        <CalendarDays className="size-3.5" />
        <span className="max-w-[200px] truncate">{rangeLabel(value)}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {RANGE_PRESETS.map((p) => (
            <Button
              key={p}
              variant={value.preset === p ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onChange({ preset: p });
                setOpen(false);
              }}
            >
              {RANGE_LABELS[p]}
            </Button>
          ))}
        </div>
        <div className="space-y-2 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">Custom range</div>
          <label className="block text-xs text-muted-foreground">
            From
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-8" />
          </label>
          <label className="block text-xs text-muted-foreground">
            To
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-8" />
          </label>
          <Button
            size="sm"
            className="w-full"
            disabled={!from || !to || new Date(from) >= new Date(to)}
            onClick={() => {
              onChange({ preset: "custom", from: fromLocalInput(from), to: fromLocalInput(to) });
              setOpen(false);
            }}
          >
            Apply custom range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
