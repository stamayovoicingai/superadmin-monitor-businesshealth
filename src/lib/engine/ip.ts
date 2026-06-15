/**
 * IP access-control engine — two independent lists (allow + block) per scope, IPv4 + CIDR.
 * See PRD/16-ip-access-control.md.
 */
import type { IpRule } from "@/lib/types";

/** Parse an IPv4 string to an unsigned 32-bit number, or null if invalid. */
export function ipToLong(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const o = Number(p);
    if (o < 0 || o > 255) return null;
    n = (n << 8) + o;
  }
  return n >>> 0;
}

/** Does `value` (single IP or CIDR) contain `ip`? IPv4 only. */
export function ipMatches(value: string, ip: string): boolean {
  const target = ipToLong(ip);
  if (target === null) return false;
  if (value.includes("/")) {
    const [base, bitsStr] = value.split("/");
    const baseLong = ipToLong(base);
    const bits = Number(bitsStr);
    if (baseLong === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (target & mask) === (baseLong & mask);
  }
  const exact = ipToLong(value);
  return exact !== null && exact === target;
}

/** Validate that a string is a valid IPv4 address or CIDR. */
export function isValidIpOrCidr(value: string): boolean {
  if (value.includes("/")) {
    const [base, bitsStr] = value.split("/");
    const bits = Number(bitsStr);
    return ipToLong(base) !== null && Number.isInteger(bits) && bits >= 0 && bits <= 32;
  }
  return ipToLong(value) !== null;
}

export interface IpDecision {
  decision: "allowed" | "blocked";
  reason: string;
  rule?: IpRule;
}

/**
 * Evaluate an IP against a set of effective rules.
 * Block always wins. If an allowlist exists (any allow rules), only matching IPs pass; otherwise
 * the default is allow.
 */
export function evaluateIp(rules: IpRule[], ip: string): IpDecision {
  const matchedBlock = rules.filter((r) => r.listType === "block").find((r) => ipMatches(r.value, ip));
  if (matchedBlock) {
    return { decision: "blocked", reason: `Blocked by rule ${matchedBlock.value}`, rule: matchedBlock };
  }
  const allows = rules.filter((r) => r.listType === "allow");
  if (allows.length > 0) {
    const matchedAllow = allows.find((r) => ipMatches(r.value, ip));
    return matchedAllow
      ? { decision: "allowed", reason: `Allowed by rule ${matchedAllow.value}`, rule: matchedAllow }
      : { decision: "blocked", reason: "Not in allowlist (default deny)" };
  }
  return { decision: "allowed", reason: "Default allow (no allowlist configured)" };
}
