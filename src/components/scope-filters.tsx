"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useView } from "@/components/view-context";
import { useCurrentIdentity, useMeta } from "@/lib/hooks";
import { orgRequiresProjectPick } from "@/lib/auth/scope";
import { DateRangeControl } from "@/components/date-range-control";

const ALL = "__all__";

/**
 * Org/Project pickers, constrained to the active identity's granted scope (PRD/01 §2.1, PRD/20 §3).
 * SuperAdmin sees every org/project and an "All" option; a scoped PM/Dev/Financial identity only
 * sees their granted orgs, must always have one selected, and only gets "All projects" for an org
 * where their grant is org-level (not project-level-only).
 */
export function ScopeFilters() {
  const { orgId, projectId, range, setOrg, setProject, setRange } = useView();
  const { data } = useMeta();
  const { user, orgIds, projectIds } = useCurrentIdentity();
  const scoped = orgIds !== null;

  const orgs = React.useMemo(() => {
    const all = data?.orgs ?? [];
    return orgIds === null ? all : all.filter((o) => orgIds.includes(o.id));
  }, [data?.orgs, orgIds]);

  const projects = React.useMemo(() => {
    const all = (data?.projects ?? []).filter((p) => !orgId || p.orgId === orgId);
    return projectIds === null ? all : all.filter((p) => projectIds.includes(p.id));
  }, [data?.projects, orgId, projectIds]);

  const hideAllProjects = scoped && !!orgId && orgRequiresProjectPick(user, orgId);

  // Scoped identity must always have a valid org selected — pick the first granted one if unset/invalid.
  React.useEffect(() => {
    if (!scoped || orgs.length === 0) return;
    if (!orgId || !orgs.some((o) => o.id === orgId)) setOrg(orgs[0].id);
  }, [scoped, orgId, orgs, setOrg]);

  // When "All projects" isn't offered for this org, force a specific granted project.
  React.useEffect(() => {
    if (!hideAllProjects || projects.length === 0) return;
    if (!projectId || !projects.some((p) => p.id === projectId)) setProject(projects[0].id);
  }, [hideAllProjects, projectId, projects, setProject]);

  return (
    <div className="flex items-center gap-2">
      <Select value={orgId ?? ALL} onValueChange={(v) => setOrg(v && v !== ALL ? v : undefined)}>
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue placeholder="Organization" />
        </SelectTrigger>
        <SelectContent>
          {!scoped && <SelectItem value={ALL}>All orgs</SelectItem>}
          {orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={projectId ?? ALL} onValueChange={(v) => setProject(v && v !== ALL ? v : undefined)}>
        <SelectTrigger size="sm" className="w-[180px]">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          {!hideAllProjects && <SelectItem value={ALL}>All projects</SelectItem>}
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangeControl value={range} onChange={setRange} />
    </div>
  );
}
