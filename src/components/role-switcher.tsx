"use client";

import { Eye, ShieldCheck, User } from "lucide-react";
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
import { ROLE_LABELS } from "@/lib/auth/policy";
import type { Role } from "@/lib/types";

export function RoleSwitcher() {
  const { role, setRole } = useView();
  const Icon = role === "superadmin" ? ShieldCheck : User;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2 rounded-full" />}>
        <Eye className="size-3.5" />
        <span className="hidden sm:inline">View as</span>
        <Badge variant="secondary" className="gap-1 font-semibold">
          <Icon className="size-3" />
          {ROLE_LABELS[role]}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>View as role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["superadmin", "user"] as Role[]).map((r) => (
          <DropdownMenuItem key={r} onClick={() => setRole(r)} className="gap-2">
            {r === "superadmin" ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
            {ROLE_LABELS[r]}
            {role === r && <span className="ml-auto text-xs text-muted-foreground">current</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
