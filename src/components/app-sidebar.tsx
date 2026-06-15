"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Boxes,
  ClipboardCheck,
  DollarSign,
  Flag,
  Gauge,
  LayoutDashboard,
  Network,
  PhoneCall,
  ShieldBan,
  Shuffle,
  SlidersHorizontal,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandLockup } from "@/components/brand-logo";
import { useView } from "@/components/view-context";
import { visibleNav } from "@/lib/nav";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  DollarSign,
  Gauge,
  PhoneCall,
  Bot,
  TriangleAlert,
  Activity,
  Boxes,
  Network,
  ShieldBan,
  Shuffle,
  SlidersHorizontal,
  Flag,
  TrendingUp,
  ClipboardCheck,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useView();
  const sections = visibleNav(role);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <BrandLockup />
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section, i) => (
          <SidebarGroup key={section.label ?? `s-${i}`}>
            {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? LayoutDashboard;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={active} tooltip={item.title}>
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.badge === "phase2" && <SidebarMenuBadge>P2</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
