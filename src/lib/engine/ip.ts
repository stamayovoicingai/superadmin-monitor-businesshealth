/**
 * IP access-control engine — two independent lists (allow + block) per scope, IPv4 + CIDR.
 * See PRD/16-ip-access-control.md.
 */
import type { IpDefaultPolicy, IpRule } from "@/lib/types";

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
 * Evaluate an IP against effective rules and the scope's default policy.
 * Precedence: explicit block → explicit allow → default policy.
 * - defaultPolicy "allow"  → blacklist mode (everything passes except blocked IPs)
 * - defaultPolicy "block"  → whitelist mode (only allowed IPs pass)
 */
export function evaluateIp(
  rules: IpRule[],
  ip: string,
  defaultPolicy: IpDefaultPolicy = "allow",
): IpDecision {
  const matchedBlock = rules.filter((r) => r.listType === "block").find((r) => ipMatches(r.value, ip));
  if (matchedBlock) {
    return { decision: "blocked", reason: `Blocked by rule ${matchedBlock.value}`, rule: matchedBlock };
  }
  const matchedAllow = rules.filter((r) => r.listType === "allow").find((r) => ipMatches(r.value, ip));
  if (matchedAllow) {
    return { decision: "allowed", reason: `Allowed by rule ${matchedAllow.value}`, rule: matchedAllow };
  }
  return defaultPolicy === "allow"
    ? { decision: "allowed", reason: "Default allow (blacklist mode)" }
    : { decision: "blocked", reason: "Default block (whitelist mode) — not in allowlist" };
}
