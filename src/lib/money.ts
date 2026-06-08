/** Money helpers — internal unit is integer micro-USD (1e-6 USD). */

export const MICROS_PER_USD = 1_000_000;

export const usdToMicros = (usd: number): number => Math.round(usd * MICROS_PER_USD);
export const microsToUsd = (micros: number): number => micros / MICROS_PER_USD;

/** Format micro-USD as a currency string. */
export function formatMicros(
  micros: number,
  opts: { maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
): string {
  const usd = microsToUsd(micros);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
  }).format(usd);
}

/** Compact currency, e.g. $12.3K, $1.2M. */
export function formatMicrosCompact(micros: number): string {
  const usd = microsToUsd(micros);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(usd);
}

/** Per-call cost typically tiny — show more precision. */
export function formatMicrosPrecise(micros: number): string {
  return formatMicros(micros, { minimumFractionDigits: 3, maximumFractionDigits: 4 });
}

export function formatPct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
