"use client";

import * as React from "react";
import { Lock, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useView } from "@/components/view-context";
import { useAppUsers, useCreateAppUser, useDeleteAppUser, useMeta, useUpdateAppUser } from "@/lib/hooks";
import { isSuperAdmin, ROLE_LABELS } from "@/lib/auth/policy";
import type { AccessGrant, AppUser, Organization, Project, ScopedRole } from "@/lib/types";

const ROLE_OPTIONS: ScopedRole[] = ["pm", "dev", "financial"];

export default function AccessManagementPage() {
  const { role } = useView();
  const { data: meta } = useMeta();
  const { data: users, isLoading } = useAppUsers();
  const createUser = useCreateAppUser();
  const updateUser = useUpdateAppUser();
  const deleteUser = useDeleteAppUser();
  const [editing, setEditing] = React.useState<AppUser | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  if (!isSuperAdmin(role)) {
    return (
      <div>
        <PageHeader title="Access Management" description="Provision PM/Dev/Financial access to orgs and projects." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Lock className="size-6" />
            </div>
            <div className="text-lg font-semibold">SuperAdmin only</div>
            <p className="max-w-md text-sm text-muted-foreground">User provisioning is managed by the SuperAdmin role.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgs = meta?.orgs ?? [];
  const projects = meta?.projects ?? [];

  return (
    <div>
      <PageHeader
        title="Access Management"
        description="Provision who can use the platform, as what role, and which orgs/projects they may see (PRD/20)."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add user
          </Button>
        }
      />

      <Card className="mb-4 border-dashed">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
          <Users className="mt-0.5 size-4 shrink-0" />
          <p>
            An <span className="font-medium text-foreground">organization</span> grant covers all of that org&apos;s
            current and future projects. A <span className="font-medium text-foreground">project</span> grant covers
            only that project — the user won&apos;t see &quot;All projects&quot; for that org (PRD/20 §3). SuperAdmin
            isn&apos;t provisioned here — it&apos;s never scoped.
          </p>
        </CardContent>
      </Card>

      {formOpen && (
        <UserForm
          orgs={orgs}
          projects={projects}
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSubmit={(input) => {
            if (editing) {
              updateUser.mutate(
                { id: editing.id, role: input.role, grants: input.grants },
                { onSuccess: () => { toast.success("User updated"); setFormOpen(false); }, onError: () => toast.error("Update failed") },
              );
            } else {
              createUser.mutate(input, {
                onSuccess: () => { toast.success("User provisioned"); setFormOpen(false); },
                onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
              });
            }
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Provisioned users</CardTitle>
          <CardDescription>{users?.length ?? 0} PM/Dev/Financial identities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !users || users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users provisioned yet.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-md border p-3">
                <span className="font-mono text-sm">{u.email}</span>
                <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                <div className="flex flex-wrap gap-1">
                  {u.grants.map((g) => (
                    <GrantChip key={g.id} grant={g} orgs={orgs} projects={projects} />
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(u);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove user"
                    onClick={() => deleteUser.mutate(u.id, { onSuccess: () => toast.success("Access revoked") })}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GrantChip({ grant, orgs, projects }: { grant: AccessGrant; orgs: Organization[]; projects: Project[] }) {
  const name =
    grant.scopeType === "org"
      ? (orgs.find((o) => o.id === grant.scopeId)?.name ?? grant.scopeId)
      : (projects.find((p) => p.id === grant.scopeId)?.name ?? grant.scopeId);
  return (
    <Badge variant="outline" className={grant.scopeType === "org" ? "text-primary" : "text-muted-foreground"}>
      {grant.scopeType === "org" ? "Org" : "Project"} · {name}
    </Badge>
  );
}

function UserForm({
  orgs,
  projects,
  initial,
  onCancel,
  onSubmit,
}: {
  orgs: Organization[];
  projects: Project[];
  initial: AppUser | null;
  onCancel: () => void;
  onSubmit: (input: { email: string; role: ScopedRole; grants: Omit<AccessGrant, "id">[] }) => void;
}) {
  const [email, setEmail] = React.useState(initial?.email ?? "");
  const [role, setRole] = React.useState<ScopedRole>(initial?.role ?? "dev");
  const [orgGrants, setOrgGrants] = React.useState<Set<string>>(new Set(initial?.grants.filter((g) => g.scopeType === "org").map((g) => g.scopeId)));
  const [projectGrants, setProjectGrants] = React.useState<Set<string>>(new Set(initial?.grants.filter((g) => g.scopeType === "project").map((g) => g.scopeId)));

  const toggleOrg = (id: string) => {
    const next = new Set(orgGrants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOrgGrants(next);
  };
  const toggleProject = (id: string) => {
    const next = new Set(projectGrants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setProjectGrants(next);
  };

  const grantCount = orgGrants.size + projectGrants.size;
  const canSubmit = email.trim().length > 3 && grantCount > 0;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{initial ? "Edit user" : "Add user"}</CardTitle>
        <CardDescription>Provision a PM, Dev, or Financial identity with a role and a scope.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="email@voicing.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!initial}
            className="h-8 w-64 font-mono text-xs"
          />
          <Select value={role} onValueChange={(v) => setRole(v as ScopedRole)}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scope</div>
          {orgs.map((o) => {
            const orgProjects = projects.filter((p) => p.orgId === o.id);
            const orgChecked = orgGrants.has(o.id);
            return (
              <div key={o.id} className="rounded-md border p-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={orgChecked} onChange={() => toggleOrg(o.id)} className="size-4" />
                  {o.name}
                  <span className="text-xs font-normal text-muted-foreground">(whole org — all {orgProjects.length} projects)</span>
                </label>
                {!orgChecked && (
                  <div className="ml-6 mt-1 flex flex-wrap gap-3">
                    {orgProjects.map((p) => (
                      <label key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" checked={projectGrants.has(p.id)} onChange={() => toggleProject(p.id)} className="size-3.5" />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                email,
                role,
                grants: [
                  ...Array.from(orgGrants).map((scopeId) => ({ scopeType: "org" as const, scopeId })),
                  ...Array.from(projectGrants).map((scopeId) => ({ scopeType: "project" as const, scopeId })),
                ],
              })
            }
          >
            {initial ? "Save changes" : "Provision user"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          {grantCount === 0 && <span className="text-xs text-muted-foreground">Select at least one org or project.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
