import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Sales", to: "/sales", icon: CircleDollarSign },
  { label: "Expenses", to: "/expenses", icon: WalletCards },
  { label: "Products", to: "/products", icon: Boxes },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Billing", to: "/subscription", icon: CreditCard },
  { label: "Settings", to: "/settings", icon: Settings },
];

export const ADMIN_BUTTON_NAV_ITEM: NavItem = {
  label: "Admin",
  to: "/admin",
  icon: ShieldCheck,
};
