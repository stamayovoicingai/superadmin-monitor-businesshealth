"use client";

import * as React from "react";
import { Lock, Plus, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useView } from "@/components/view-context";
import { useAddIpRule, useDeleteIpRule, useIpRules, useMeta, useSetIpPolicy } from "@/lib/hooks";
import { isSuperAdmin } from "@/lib/auth/policy";
import { evaluateIp, isValidIpOrCidr } from "@/lib/engine/ip";
import { cn } from "@/lib/utils";
import type { IpListType, IpRule } from "@/lib/types";

export default function AccessPage() {
  const { role, orgId, projectId } = useView();
  const { data: meta } = useMeta();
  const { data, isLoading } = useIpRules();
  const addRule = useAddIpRule();
  const deleteRule = useDeleteIpRule();
  const setPolicy = useSetIpPolicy();
  const [testIp, setTestIp] = React.useState("");

  if (!isSuperAdmin(role)) {
    return (
      <div>
        <PageHeader title="IP Access Control" description="Whitelist / blacklist IPs for platform.voicing.ai." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Lock className="size-6" />
            </div>
            <div className="text-lg font-semibold">SuperAdmin only</div>
            <p className="max-w-md text-sm text-muted-foreground">
              IP access rules are managed by the SuperAdmin role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopeType: "org" | "project" | null = projectId ? "project" : orgId ? "org" : null;
  const scopeId = projectId ?? orgId ?? null;
  const orgName = meta?.orgs.find((o) => o.id === orgId)?.name;
  const projectName = meta?.projects.find((p) => p.id === projectId)?.name;
  const scopeLabel = projectId ? `${projectName} (project)` : orgId ? `${orgName} (organization)` : null;

  const own = data?.own ?? [];
  const inherited = data?.inherited ?? [];
  const effective = [...own, ...inherited];
  const defaultPolicy = data?.defaultPolicy ?? "allow";
  const decision = testIp.trim() ? evaluateIp(effective, testIp.trim(), defaultPolicy) : null;

  function changePolicy(next: "allow" | "block") {
    if (!scopeType || !scopeId || next === defaultPolicy) return;
    setPolicy.mutate(
      { scopeType, scopeId, defaultPolicy: next },
      {
        onSuccess: () =>
          toast.success(next === "allow" ? "Default: Allow (blacklist mode)" : "Default: Block (whitelist mode)"),
      },
    );
  }

  function add(listType: IpListType, value: string, label: string, reset: () => void) {
    if (!scopeType || !scopeId) return;
    if (!isValidIpOrCidr(value)) {
      toast.error("Enter a valid IPv4 address or CIDR (e.g. 203.0.113.0/24)");
      return;
    }
    addRule.mutate(
      { scopeType, scopeId, listType, value, label },
      {
        onSuccess: () => {
          toast.success(`${listType === "allow" ? "Allow" : "Block"} rule added`);
          reset();
        },
        onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="IP Access Control"
        description="Whitelist / blacklist IPs for platform.voicing.ai, per organization or project. Block always wins; an allowlist (if any) restricts access to listed IPs only."
      />

      {!scopeType ? (
        <Card className="mb-4 border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Select an <span className="font-medium text-foreground">organization</span> or{" "}
            <span className="font-medium text-foreground">project</span> in the top bar to manage its IP rules.
            Showing all rules read-only below.
          </CardContent>
        </Card>
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Managing rules for</span>
          <Badge variant="secondary" className="font-semibold">{scopeLabel}</Badge>
          {projectId && (
            <span className="text-muted-foreground">· inherits {inherited.length} org rule(s)</span>
          )}
        </div>
      )}

      {scopeType && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Default policy</CardTitle>
            <CardDescription>What happens to an IP that matches no rule at this scope</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => changePolicy("allow")}
              className={cn(
                "flex-1 rounded-lg border p-3 text-left transition",
                defaultPolicy === "allow" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4 text-success" /> Allow by default
                {defaultPolicy === "allow" && <Badge variant="secondary" className="ml-auto">Active</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Blacklist mode — everyone passes except the IPs you block.</p>
            </button>
            <button
              type="button"
              onClick={() => changePolicy("block")}
              className={cn(
                "flex-1 rounded-lg border p-3 text-left transition",
                defaultPolicy === "block" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                <ShieldBan className="size-4 text-critical" /> Block by default
                {defaultPolicy === "block" && <Badge variant="secondary" className="ml-auto">Active</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Whitelist mode — only the IPs / CIDRs you allow can access.</p>
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RuleListCard
          title="Allowlist"
          icon={<ShieldCheck className="size-4 text-success" />}
          description="Explicitly permitted IPs/CIDRs (the only ones allowed in whitelist mode)."
          listType="allow"
          rules={own.filter((r) => r.listType === "allow")}
          canEdit={!!scopeType}
          loading={isLoading}
          onAdd={add}
          onDelete={(id) => deleteRule.mutate(id, { onSuccess: () => toast.success("Rule removed") })}
        />
        <RuleListCard
          title="Blocklist"
          icon={<ShieldBan className="size-4 text-critical" />}
          description="Explicitly denied IPs/CIDRs — always wins, in any mode."
          listType="block"
          rules={own.filter((r) => r.listType === "block")}
          canEdit={!!scopeType}
          loading={isLoading}
          onAdd={add}
          onDelete={(id) => deleteRule.mutate(id, { onSuccess: () => toast.success("Rule removed") })}
        />
      </div>

      {projectId && inherited.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Inherited from organization</CardTitle>
            <CardDescription>Read-only · managed at the org scope</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {inherited.map((r) => (
              <RuleChip key={r.id} rule={r} />
            ))}
          </CardContent>
        </Card>
      )}

      {scopeType && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Test an IP</CardTitle>
            <CardDescription>Evaluate an address against the effective rules for this scope</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="e.g. 190.85.12.4"
              value={testIp}
              onChange={(e) => setTestIp(e.target.value)}
              className="h-8 w-56 font-mono"
            />
            {decision && (
              <Badge className={decision.decision === "allowed" ? "bg-success/10 text-success" : "bg-critical/10 text-critical"}>
                {decision.decision === "allowed" ? "ALLOWED" : "BLOCKED"}
              </Badge>
            )}
            {decision && <span className="text-sm text-muted-foreground">{decision.reason}</span>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RuleChip({ rule }: { rule: IpRule }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm">
      <Badge variant="outline" className={rule.listType === "allow" ? "text-success" : "text-critical"}>
        {rule.listType}
      </Badge>
      <span className="font-mono">{rule.value}</span>
      {rule.label && <span className="text-xs text-muted-foreground">· {rule.label}</span>}
    </div>
  );
}

function RuleListCard({
  title,
  icon,
  description,
  listType,
  rules,
  canEdit,
  loading,
  onAdd,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  listType: IpListType;
  rules: IpRule[];
  canEdit: boolean;
  loading: boolean;
  onAdd: (listType: IpListType, value: string, label: string, reset: () => void) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = React.useState("");
  const [label, setLabel] = React.useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-auto">{rules.length}</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {listType} rules at this scope.</p>
        ) : (
          <ul className="space-y-1.5">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                <span className="font-mono text-sm">{r.value}</span>
                {r.label && <span className="truncate text-xs text-muted-foreground">· {r.label}</span>}
                <Button variant="ghost" size="icon" className="ml-auto size-7" onClick={() => onDelete(r.id)} aria-label="Remove rule">
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Input placeholder="IP or CIDR" value={value} onChange={(e) => setValue(e.target.value)} className="h-8 w-36 font-mono" />
            <Input placeholder="Label / reason" value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 w-40" />
            <Button
              size="sm"
              variant={listType === "block" ? "destructive" : "default"}
              disabled={!value.trim()}
              onClick={() =>
                onAdd(listType, value, label, () => {
                  setValue("");
                  setLabel("");
                })
              }
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
