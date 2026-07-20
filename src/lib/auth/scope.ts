/**
 * Effective org/project scope for a provisioned (non-SuperAdmin) identity — PRD/01 §6, PRD/20 §4.
 * `user: null` means "unrestricted" (SuperAdmin, or no identity being previewed) — every helper
 * returns `null` in that case to mean "no restriction," never an empty array (which would mean
 * "restricted to nothing").
 */
import type { AppUser, Project } from "@/lib/types";

/** Org ids the identity may see — via a direct org grant, or via any project grant in that org. */
export function effectiveOrgIds(user: AppUser | null, projects: Project[]): string[] | null {
  if (!user) return null;
  const orgIds = new Set<string>();
  for (const g of user.grants) {
    if (g.scopeType === "org") {
      orgIds.add(g.scopeId);
    } else {
      const project = projects.find((p) => p.id === g.scopeId);
      if (project) orgIds.add(project.orgId);
    }
  }
  return Array.from(orgIds);
}

/** Project ids the identity may see — direct project grants, plus every project under an org grant. */
export function effectiveProjectIds(user: AppUser | null, projects: Project[]): string[] | null {
  if (!user) return null;
  const projectIds = new Set<string>();
  for (const g of user.grants) {
    if (g.scopeType === "project") {
      projectIds.add(g.scopeId);
    } else {
      for (const p of projects.filter((pr) => pr.orgId === g.scopeId)) projectIds.add(p.id);
    }
  }
  return Array.from(projectIds);
}

export function canAccessOrg(user: AppUser | null, orgId: string, projects: Project[]): boolean {
  const ids = effectiveOrgIds(user, projects);
  return ids === null || ids.includes(orgId);
}

export function canAccessProject(user: AppUser | null, projectId: string, projects: Project[]): boolean {
  const ids = effectiveProjectIds(user, projects);
  return ids === null || ids.includes(projectId);
}

/**
 * True when the identity's access to `orgId` is project-level only (no org-level grant) — the org's
 * "All projects" option must be hidden for them (PRD/20 §3).
 */
export function orgRequiresProjectPick(user: AppUser | null, orgId: string): boolean {
  if (!user) return false;
  return !user.grants.some((g) => g.scopeType === "org" && g.scopeId === orgId);
}
