import {
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  PanelTop,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { NavItem } from "./nav";

export type AdminNavGroup = {
  label: string;
  items: NavItem[];
};

export type AdminMobileNavItem = NavItem & {
  match: string[];
  exact?: boolean;
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Users & Businesses",
    items: [
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Businesses", to: "/admin/businesses", icon: Building2 },
    ],
  },
  {
    label: "Subscriptions",
    items: [
      { label: "Packages", to: "/admin/packages", icon: Package },
      { label: "Subscriptions", to: "/admin/subscriptions", icon: CreditCard },
    ],
  },
  {
    label: "Website",
    items: [{ label: "Landing Page", to: "/admin/landing-page", icon: PanelTop }],
  },
  {
    label: "System Config",
    items: [
      { label: "Email Config", to: "/admin/config/email", icon: Mail },
      { label: "Security Config", to: "/admin/config/security", icon: ShieldCheck },
      { label: "SMS Config", to: "/admin/config/sms", icon: MessageSquare },
      { label: "Email Templates", to: "/admin/templates/email", icon: FileText },
      { label: "SMS Templates", to: "/admin/templates/sms", icon: FileText },
    ],
  },
  {
    label: "Logs",
    items: [{ label: "Audit Logs", to: "/admin/audit-logs", icon: ClipboardList }],
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export const ADMIN_MOBILE_NAV_ITEMS: AdminMobileNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, match: ["/admin"], exact: true },
  { label: "People", to: "/admin/users", icon: Users, match: ["/admin/users", "/admin/businesses"] },
  { label: "Plans", to: "/admin/packages", icon: Package, match: ["/admin/packages", "/admin/subscriptions"] },
  { label: "Website", to: "/admin/landing-page", icon: PanelTop, match: ["/admin/landing-page"] },
  { label: "Config", to: "/admin/config/email", icon: Settings, match: ["/admin/config", "/admin/templates"] },
  { label: "Logs", to: "/admin/audit-logs", icon: ClipboardList, match: ["/admin/audit-logs"] },
];

export function isAdminPathActive(pathname: string, item: { to: string; match?: string[]; exact?: boolean }) {
  if (item.exact) return pathname === item.to;
  const paths = item.match?.length ? item.match : [item.to];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
