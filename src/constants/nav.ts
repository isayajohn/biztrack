import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  PackagePlus,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  section?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Sales", to: "/sales", icon: CircleDollarSign },
  { label: "Expenses", to: "/expenses", icon: WalletCards },
  { label: "Products", to: "/products", icon: Boxes },
  { label: "Reports", to: "/reports", icon: BarChart3 },

  // Inventory
  { label: "Categories", to: "/inventory/categories", icon: Tag, section: "Inventory" },
  { label: "Suppliers", to: "/inventory/suppliers", icon: Truck, section: "Inventory" },
  { label: "Purchases", to: "/inventory/purchases", icon: ShoppingCart, section: "Inventory" },
  { label: "Stock In", to: "/inventory/stock-in", icon: PackagePlus, section: "Inventory" },
  { label: "Stock Movements", to: "/inventory/stock-movements", icon: ArrowLeftRight, section: "Inventory" },
  { label: "Damaged Stock", to: "/inventory/damaged-stock", icon: AlertTriangle, section: "Inventory" },
  { label: "Inv. Reports", to: "/inventory/reports", icon: BarChart3, section: "Inventory" },

  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Billing", to: "/subscription", icon: CreditCard },
  { label: "Settings", to: "/settings", icon: Settings },
];

export const ADMIN_BUTTON_NAV_ITEM: NavItem = {
  label: "Admin",
  to: "/admin",
  icon: ShieldCheck,
};
