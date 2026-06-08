/**
 * Authorization policy — single source of truth for role visibility.
 * Two roles (PRD/01): superadmin (everything) and user (project performance + cost-to-serve,
 * but NEVER revenue / margin / business financials).
 */
import type { Role } from "@/lib/types";

/** Revenue, margin, MRR, business health — superadmin only. */
export function canSeeFinancials(role: Role): boolean {
  return role === "superadmin";
}

/** Cost-to-serve in USD — both roles (PRD/01 §4, confirmed). */
export function canSeeCost(): boolean {
  return true;
}

/** Business Health module, infra controls, fallbacks, threshold config, flag queue. */
export function canSeeSuperAdminOnly(role: Role): boolean {
  return role === "superadmin";
}

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "SuperAdmin",
  user: "User",
};
