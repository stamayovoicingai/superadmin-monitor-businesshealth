"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DispositionBadge, EndReasonChip, StatusChip } from "@/components/chips";
import { useCall, useCreateFlag } from "@/lib/hooks";
import { useFinancials } from "@/components/financial-gate";
import { formatMicros, formatMicrosPrecise, formatNumber, microsToUsd } from "@/lib/money";
import { SERVICE_LABELS } from "@/lib/engine/pricing";
import type { Call } from "@/lib/types";

function buildTranscript(call: Call) {
  const turns = Math.max(2, Math.min(10, Math.round(call.durationSecs / 35)));
  const agentLines = [
    "Hi, thanks for calling — how can I help you today?",
    "I can help with that. Let me pull up your account.",
    "Got it. Can you confirm the last four digits on file?",
    "Thanks. I've found your record.",
    "Let me check the available options for you.",
    "Is there anything else I can help you with?",
  ];
  const userLines = [
    "Yes, I have a question about my last invoice.",
    "Sure, it ends in 4821.",
    "Okay, that works for me.",
    "Can you repeat that please?",
    "Great, thank you.",
    "No, that's all.",
  ];
  const out: { role: "agent" | "user"; text: string; t: number }[] = [];
  for (let i = 0; i < turns; i++) {
    const isAgent = i % 2 === 0;
    out.push({
      role: isAgent ? "agent" : "user",
      text: (isAgent ? agentLines : userLines)[Math.floor(i / 2) % 6],
      t: Math.round((call.durationSecs / turns) * i),
    });
  }
  return out;
}

export default function CallDetailPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const fin = useFinancials();
  const { data, isLoading } = useCall(params.callId);
  const createFlag = useCreateFlag();
  const [flagNote, setFlagNote] = React.useState("");
  const [flagOpen, setFlagOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Call not found.
        <div className="mt-3">
          <Button variant="outline" onClick={() => router.push("/calls")}>Back to call logs</Button>
        </div>
      </div>
    );
  }

  const { call } = data;
  const transcript = buildTranscript(call);
  const services: { key: keyof typeof SERVICE_LABELS; micros: number }[] = [
    { key: "llm", micros: call.cost.llmMicros },
    { key: "stt", micros: call.cost.sttMicros },
    { key: "tts", micros: call.cost.ttsMicros },
    { key: "telephony", micros: call.cost.telephonyMicros },
    { key: "cloud", micros: call.cost.cloudMicros },
  ];
  const lat = call.latency;
  const latSegments = [
    { label: "STT", ms: lat.sttMs, color: "var(--chart-3)" },
    { label: "LLM", ms: lat.llmMs, color: "var(--chart-1)" },
    { label: "Tool", ms: lat.toolMs, color: "var(--chart-2)" },
    { label: "TTS", ms: lat.ttsMs, color: "var(--chart-4)" },
    { label: "Telephony", ms: lat.telephonyMs, color: "var(--chart-5)" },
  ];

  return (
    <div>
      <PageHeader
        title={call.callId}
        description={`${data.projectName} · ${data.orgName} · ${data.agentName}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => router.push("/calls")}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Popover open={flagOpen} onOpenChange={setFlagOpen}>
              <PopoverTrigger render={<Button variant={call.flagged ? "secondary" : "default"} size="sm" />}>
                <Flag className="size-4" /> {call.flagged ? "Flagged" : "Flag this call"}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-2">
                <div className="text-sm font-semibold">Flag this call</div>
                <p className="text-xs text-muted-foreground">Describe the problem. It enters the review queue (Controls → Flag Queue).</p>
                <textarea
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  placeholder="What went wrong on this call?"
                  rows={3}
                  className="w-full rounded-md border bg-transparent p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!flagNote.trim()}
                  onClick={() =>
                    createFlag.mutate(
                      { callId: call.callId, comment: flagNote.trim() },
                      {
                        onSuccess: () => {
                          toast.success("Call flagged for review");
                          setFlagNote("");
                          setFlagOpen(false);
                        },
                        onError: () => toast.error("Could not flag the call"),
                      },
                    )
                  }
                >
                  <Flag className="size-4" /> Flag for review
                </Button>
              </PopoverContent>
            </Popover>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusChip status={call.status} />
        <EndReasonChip reason={call.closedReason} />
        <DispositionBadge disposition={call.disposition} />
        <Badge variant="outline">Session {call.sessionId}</Badge>
        <Badge variant="outline">Pod {call.hostId}</Badge>
        <Badge variant="outline">{new Date(call.startTime).toLocaleString()}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Turn-by-turn conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {transcript.map((turn, i) => (
              <div key={i} className={turn.role === "agent" ? "" : "flex flex-col items-end"}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${turn.role === "agent" ? "bg-secondary" : "bg-primary text-primary-foreground"}`}>
                  {turn.text}
                </div>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {turn.role === "agent" ? "Agent" : "Caller"} · {turn.t}s
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recording</CardTitle>
            </CardHeader>
            <CardContent>
              {call.recordingUrl ? (
                <audio controls className="w-full">
                  <source src={call.recordingUrl} type="audio/mpeg" />
                </audio>
              ) : (
                <p className="text-sm text-muted-foreground">No recording (call still active).</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost breakdown</CardTitle>
              <CardDescription>Per service{fin ? " · with margin" : ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {services.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{SERVICE_LABELS[s.key]}</span>
                  <span className="tabular-nums">{formatMicrosPrecise(s.micros)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-semibold">
                <span>Total cost</span>
                <span className="tabular-nums">{formatMicrosPrecise(call.cost.totalMicros)}</span>
              </div>
              {fin && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="tabular-nums">{formatMicrosPrecise(call.cost.revenueMicros)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold" style={{ color: call.cost.marginMicros >= 0 ? "var(--success)" : "var(--critical)" }}>
                    <span>Margin</span>
                    <span className="tabular-nums">{formatMicrosPrecise(call.cost.marginMicros)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency waterfall</CardTitle>
            <CardDescription>Total {formatNumber(lat.totalMs)} ms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {latSegments.map((seg) => (
              <div key={seg.label}>
                <div className="mb-0.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{seg.label}</span>
                  <span className="tabular-nums">{seg.ms} ms</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(seg.ms / lat.totalMs) * 100}%`, background: seg.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error logs</CardTitle>
            <CardDescription>{call.errorCount > 0 ? `${call.errorCount} error(s)` : "No errors"}</CardDescription>
          </CardHeader>
          <CardContent>
            {call.errorCount > 0 ? (
              <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                {Array.from({ length: call.errorCount }).map((_, i) => (
                  `[${new Date(new Date(call.startTime).getTime() + i * 8000).toISOString()}] | ERROR | ${call.hostId}: turn ${i + 1} provider timeout, retried\n`
                ))}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Clean call — no error log entries.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-3 text-right text-xs text-muted-foreground">
        Cost-to-serve ≈ {formatMicros(call.cost.totalMicros)} (≈ ${microsToUsd(call.cost.totalMicros).toFixed(4)})
      </p>
    </div>
  );
}
