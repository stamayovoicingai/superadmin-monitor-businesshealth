/** Sidebar navigation config. See PRD/02-information-architecture.md §2, PRD/01 §3. */
import type { Role } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: string; // lucide icon name
  /** Roles allowed to see this item. Omit = every role. */
  roles?: Role[];
  badge?: "phase2";
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

const FINANCIAL_ROLES: Role[] = ["superadmin", "pm", "financial"];
const OPS_ROLES: Role[] = ["superadmin", "pm", "dev"];

export const NAV: NavSection[] = [
  {
    items: [{ title: "Overview", href: "/overview", icon: "LayoutDashboard" }],
  },
  {
    label: "Observe",
    items: [
      { title: "Cost & Margin", href: "/cost", icon: "DollarSign", roles: FINANCIAL_ROLES },
      { title: "Performance", href: "/performance", icon: "Gauge", roles: OPS_ROLES },
      { title: "Call Logs", href: "/calls", icon: "PhoneCall", roles: OPS_ROLES },
      { title: "Assistant Usage", href: "/assistant", icon: "Bot", roles: FINANCIAL_ROLES },
      { title: "Issues", href: "/issues", icon: "TriangleAlert", roles: OPS_ROLES },
    ],
  },
  {
    label: "Infra",
    items: [
      { title: "Live Operations", href: "/live", icon: "Activity", roles: OPS_ROLES },
      { title: "Service Health", href: "/health", icon: "HeartPulse", roles: OPS_ROLES },
      { title: "Kubernetes", href: "/infra/kubernetes", icon: "Boxes", roles: OPS_ROLES },
      { title: "AWS ELB", href: "/infra/elb", icon: "Network", roles: OPS_ROLES },
      { title: "Telephony", href: "/infra/telephony", icon: "Waypoints", roles: OPS_ROLES },
    ],
  },
  {
    label: "Controls",
    items: [
      { title: "Fallbacks", href: "/controls/fallbacks", icon: "Shuffle", roles: OPS_ROLES },
      { title: "Thresholds", href: "/controls/thresholds", icon: "SlidersHorizontal", roles: OPS_ROLES },
      { title: "Flag Queue", href: "/controls/flags", icon: "Flag", roles: OPS_ROLES },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Business Health", href: "/business", icon: "TrendingUp", roles: FINANCIAL_ROLES },
      { title: "Invoicing", href: "/invoicing", icon: "Receipt", roles: FINANCIAL_ROLES },
    ],
  },
  {
    label: "QA Bench",
    items: [{ title: "Evals", href: "/qa-bench", icon: "ClipboardCheck", roles: OPS_ROLES, badge: "phase2" }],
  },
  {
    label: "Admin",
    items: [
      { title: "IP Access", href: "/controls/access", icon: "ShieldBan", roles: ["superadmin"] },
      { title: "Access Management", href: "/controls/access-management", icon: "Users", roles: ["superadmin"] },
    ],
  },
  {
    label: "System",
    items: [{ title: "Design System", href: "/design", icon: "Palette" }],
  },
];

export function visibleNav(role: Role): NavSection[] {
  return NAV.map((section) => ({
    ...section,
    items: section.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);
}
