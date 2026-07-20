/**
 * Authorization policy — single source of truth for role visibility.
 * Four roles (PRD/01): superadmin (everything, unscoped), pm (everything, scoped to granted
 * orgs/projects), dev (ops modules only, zero cost, scoped), financial (money modules only, scoped).
 * See lib/auth/scope.ts for the org/project scoping helpers that pair with these predicates.
 */
import type { Role } from "@/lib/types";

/** True for the one unscoped, fully-privileged role. */
export function isSuperAdmin(role: Role): boolean {
  return role === "superadmin";
}

/** Cost, revenue, margin, MRR/churn/growth — any money figure, anywhere in the app. */
export function canSeeFinancials(role: Role): boolean {
  return role === "superadmin" || role === "pm" || role === "financial";
}

/** Performance, call logs, live ops, issues, infra (k8s/ELB/telephony), service health, operator controls. */
export function canSeeOpsModules(role: Role): boolean {
  return role === "superadmin" || role === "pm" || role === "dev";
}

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "SuperAdmin",
  pm: "PM",
  dev: "Dev",
  financial: "Financial",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superadmin: "Full, unscoped access to everything.",
  pm: "Everything — ops and financials — scoped to granted orgs/projects.",
  dev: "Operational and service-health modules only. Never sees cost, revenue, or margin.",
  financial: "Cost & Margin and Business Health only. No operational modules.",
};
