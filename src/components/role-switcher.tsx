"use client";

import { Briefcase, DollarSign, Eye, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useView } from "@/components/view-context";
import { useAppUsers } from "@/lib/hooks";
import { ROLE_LABELS } from "@/lib/auth/policy";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["superadmin", "pm", "dev", "financial"];

const ROLE_ICONS: Record<Role, LucideIcon> = {
  superadmin: ShieldCheck,
  pm: Briefcase,
  dev: Wrench,
  financial: DollarSign,
};

/**
 * Two-step "View as": pick a role, then — for PM/Dev/Financial — which provisioned identity
 * (PRD/01 §2.1). Their granted orgs/projects differ, so previewing "as a role" alone isn't enough.
 */
export function RoleSwitcher() {
  const { role, simulatedUserId, setRole, setSimulatedUser } = useView();
  const { data: users } = useAppUsers();
  const Icon = ROLE_ICONS[role];
  const currentUser = users?.find((u) => u.id === simulatedUserId);
  const roleUsers = (users ?? []).filter((u) => u.role === role);

  const handlePickRole = (r: Role) => {
    setRole(r);
    if (r !== "superadmin") setSimulatedUser((users ?? []).find((u) => u.role === r)?.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2 rounded-full" />}>
        <Eye className="size-3.5" />
        <span className="hidden sm:inline">View as</span>
        <Badge variant="secondary" className="gap-1 font-semibold">
          <Icon className="size-3" />
          {ROLE_LABELS[role]}
          {currentUser && <span className="font-normal text-muted-foreground">· {currentUser.email}</span>}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>View as role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((r) => {
          const RIcon = ROLE_ICONS[r];
          return (
            <DropdownMenuItem key={r} onClick={() => handlePickRole(r)} className="gap-2">
              <RIcon className="size-4" />
              {ROLE_LABELS[r]}
              {role === r && <span className="ml-auto text-xs text-muted-foreground">current</span>}
            </DropdownMenuItem>
          );
        })}

        {role !== "superadmin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Preview as ({ROLE_LABELS[role]})</DropdownMenuLabel>
            {roleUsers.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No {ROLE_LABELS[role]} users provisioned yet — add one in Access Management.
              </div>
            ) : (
              roleUsers.map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => setSimulatedUser(u.id)} className="gap-2">
                  <span className="truncate font-mono text-xs">{u.email}</span>
                  {simulatedUserId === u.id && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                </DropdownMenuItem>
              ))
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
