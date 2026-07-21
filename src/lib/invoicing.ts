/**
 * Invoicing engine — pure functions. See PRD/21-module-invoicing.md.
 * Timezone math uses Intl.DateTimeFormat wall-clock conversion (no external tz library) — correct
 * for the common case, not exhaustively DST-audited (PRD/21 §7).
 */
import type { Call, InvoiceColumnKey, InvoiceConfig, InvoiceDowntimeExclusion, InvoiceFrequency } from "@/lib/types";

export const INVOICE_TIMEZONES = [
  "UTC",
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/New_York",
  "Asia/Manila",
  "Asia/Kolkata",
  "Asia/Singapore",
] as const;

export const INVOICE_COLUMNS: { key: InvoiceColumnKey; label: string; extract: (c: Call) => string | number }[] = [
  { key: "session_id", label: "Session ID", extract: (c) => c.sessionId },
  { key: "call_id", label: "Call ID", extract: (c) => c.callId },
  { key: "start_time", label: "Start Time", extract: (c) => c.startTime },
  { key: "end_time", label: "End Time", extract: (c) => c.endTime ?? "" },
  { key: "duration_secs", label: "Duration (secs)", extract: (c) => c.durationSecs },
  { key: "caller_id", label: "Caller ID (user_id)", extract: (c) => c.callerHash },
];

export const DEFAULT_INVOICE_SUBJECT = "Voicing AI — Usage report for {{project_name}} ({{period_start}} – {{period_end}})";
export const DEFAULT_INVOICE_BODY =
  "Hi,\n\nAttached is the call usage report for {{org_name}} / {{project_name}} covering {{period_start}} to {{period_end}}.\n\nTotal calls: {{call_count}}\nTotal minutes: {{total_minutes}}\n\nBest,\nVoicing AI";

/* ----- Timezone helpers (Intl-based, no external dependency) ----- */

function partsInTz(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +(parts.hour === "24" ? "0" : parts.hour), minute: +parts.minute, second: +parts.second };
}

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

/** Converts a wall-clock date/time *in `timeZone`* to the equivalent UTC instant. */
function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, second: number, timeZone: string): Date {
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offsetMin = tzOffsetMinutes(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offsetMin * 60000);
}

function frequencyDaysOf(config: { frequency: InvoiceFrequency; frequencyDays?: number }): number {
  switch (config.frequency) {
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30; // approximation, used only for the "next run" hint — the preview period itself is calendar-accurate
    case "custom_days":
      return Math.max(1, config.frequencyDays ?? 30);
  }
}

/** Last *completed* period for this frequency, in the config's timezone — the default preview window. */
export function defaultPeriodFor(config: { frequency: InvoiceFrequency; frequencyDays?: number }, timezone: string, now: Date): { from: string; to: string } {
  const p = partsInTz(now, timezone);
  const todayStartUtc = zonedTimeToUtc(p.year, p.month, p.day, 0, 0, 0, timezone);

  if (config.frequency === "monthly") {
    const startOfThisMonth = zonedTimeToUtc(p.year, p.month, 1, 0, 0, 0, timezone);
    const prevMonthRef = new Date(p.year, p.month - 2, 1); // plain JS date math just to roll year/month
    const startOfPrevMonth = zonedTimeToUtc(prevMonthRef.getFullYear(), prevMonthRef.getMonth() + 1, 1, 0, 0, 0, timezone);
    return { from: startOfPrevMonth.toISOString(), to: startOfThisMonth.toISOString() };
  }

  const days = frequencyDaysOf(config);
  return { from: new Date(todayStartUtc.getTime() - days * 86400000).toISOString(), to: todayStartUtc.toISOString() };
}

/** Display hint only — approximate for "monthly" (30d), calendar-accurate math lives in defaultPeriodFor. */
export function computeNextRun(config: { frequency: InvoiceFrequency; frequencyDays?: number; lastSentAt: string | null; createdAt: string }, now: Date): string {
  const days = frequencyDaysOf(config);
  const base = new Date(config.lastSentAt ?? config.createdAt).getTime();
  let next = base + days * 86400000;
  while (next < now.getTime()) next += days * 86400000;
  return new Date(next).toISOString();
}

/* ----- Filtering & export ----- */

export interface InvoiceFilterResult {
  included: Call[];
  excludedTestCalls: number;
  excludedDowntimeCalls: number;
}

export function filterInvoiceCalls(
  calls: Call[],
  config: Pick<InvoiceConfig, "excludeCallerIds" | "excludeCallIds">,
  downtime: InvoiceDowntimeExclusion[],
  from: string,
  to: string,
): InvoiceFilterResult {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const excludeCallers = new Set(config.excludeCallerIds);
  const excludeCalls = new Set(config.excludeCallIds);
  const downtimeWindows = downtime.map((d) => ({ from: new Date(d.from).getTime(), to: new Date(d.to).getTime() }));

  let excludedTestCalls = 0;
  let excludedDowntimeCalls = 0;
  const included: Call[] = [];

  for (const c of calls) {
    const t = new Date(c.startTime).getTime();
    if (t < fromMs || t >= toMs) continue;
    if (excludeCallers.has(c.callerHash) || excludeCalls.has(c.callId)) {
      excludedTestCalls++;
      continue;
    }
    if (downtimeWindows.some((w) => t >= w.from && t < w.to)) {
      excludedDowntimeCalls++;
      continue;
    }
    included.push(c);
  }
  return { included, excludedTestCalls, excludedDowntimeCalls };
}

function escapeCsv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildInvoiceCsv(calls: Call[], columns: InvoiceColumnKey[]): string {
  const cols = INVOICE_COLUMNS.filter((c) => columns.includes(c.key));
  const header = cols.map((c) => c.label).join(",");
  const rows = calls.map((c) => cols.map((col) => escapeCsv(String(col.extract(c)))).join(","));
  return [header, ...rows].join("\n");
}

export function mergeTemplate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ""));
}

function fmtDateShort(iso: string, timezone: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: timezone, year: "numeric", month: "short", day: "numeric" });
}

export function invoiceTemplateVars(opts: {
  orgName: string;
  projectName: string;
  periodFrom: string;
  periodTo: string;
  timezone: string;
  callCount: number;
  totalMinutes: number;
}): Record<string, string | number> {
  return {
    org_name: opts.orgName,
    project_name: opts.projectName,
    period_start: fmtDateShort(opts.periodFrom, opts.timezone),
    period_end: fmtDateShort(opts.periodTo, opts.timezone),
    call_count: opts.callCount,
    total_minutes: opts.totalMinutes,
  };
}
