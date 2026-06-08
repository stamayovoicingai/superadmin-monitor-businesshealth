import { cn } from "@/lib/utils";

/** Voicing AI waveform/equalizer mark (approximation of the brand logo). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-square items-center justify-center rounded-[10px] bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3/5 w-3/5" fill="none" aria-hidden>
        {[
          { x: 3, h: 6 },
          { x: 8, h: 14 },
          { x: 13, h: 10 },
          { x: 18, h: 16 },
        ].map((b) => (
          <rect
            key={b.x}
            x={b.x}
            y={(24 - b.h) / 2}
            width={3}
            height={b.h}
            rx={1.5}
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  );
}

export function BrandLockup({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="size-8" />
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight">Voicing AI</div>
          <div className="text-[10px] font-medium text-muted-foreground">SuperAdmin</div>
        </div>
      )}
    </div>
  );
}
