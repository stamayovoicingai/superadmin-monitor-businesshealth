/** Sidebar navigation config. See PRD/02-information-architecture.md §2. */
import type { Role } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: string; // lucide icon name
  superAdminOnly?: boolean;
  badge?: "phase2";
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    items: [{ title: "Overview", href: "/overview", icon: "LayoutDashboard" }],
  },
  {
    label: "Observe",
    items: [
      { title: "Cost & Margin", href: "/cost", icon: "DollarSign" },
      { title: "Performance", href: "/performance", icon: "Gauge" },
      { title: "Call Logs", href: "/calls", icon: "PhoneCall" },
      { title: "Issues", href: "/issues", icon: "TriangleAlert" },
    ],
  },
  {
    label: "Infra",
    items: [
      { title: "Live Operations", href: "/live", icon: "Activity" },
      { title: "Kubernetes", href: "/infra/kubernetes", icon: "Boxes", superAdminOnly: true },
      { title: "AWS ELB", href: "/infra/elb", icon: "Network", superAdminOnly: true },
    ],
  },
  {
    label: "Controls",
    items: [
      { title: "Fallbacks", href: "/controls/fallbacks", icon: "Shuffle", superAdminOnly: true },
      { title: "Thresholds", href: "/controls/thresholds", icon: "SlidersHorizontal", superAdminOnly: true },
      { title: "Flag Queue", href: "/controls/flags", icon: "Flag", superAdminOnly: true },
    ],
  },
  {
    label: "Business",
    items: [{ title: "Business Health", href: "/business", icon: "TrendingUp", superAdminOnly: true }],
  },
  {
    label: "QA Bench",
    items: [{ title: "Evals", href: "/qa-bench", icon: "ClipboardCheck", badge: "phase2" }],
  },
];

export function visibleNav(role: Role): NavSection[] {
  return NAV.map((section) => ({
    ...section,
    items: section.items.filter((i) => !i.superAdminOnly || role === "superadmin"),
  })).filter((s) => s.items.length > 0);
}
