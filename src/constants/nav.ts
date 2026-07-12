import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  PackagePlus,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Tags,
  Percent,
  UserCog,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  section?: string;
  permission?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },

  // Business
  { label: "Sales", to: "/sales", icon: CircleDollarSign, section: "Business", permission: "sales.view" },
  { label: "Expenses", to: "/expenses", icon: WalletCards, section: "Business", permission: "expenses.view" },
  { label: "Products", to: "/products", icon: Boxes, section: "Business", permission: "products.view" },
  { label: "Customers", to: "/customers", icon: Users, section: "Business", permission: "customers.view" },
  { label: "Promotions", to: "/promotions", icon: Percent, section: "Business", permission: "promotions.manage" },
  { label: "Reports", to: "/reports", icon: BarChart3, section: "Business", permission: "reports.view" },

  // Inventory
  { label: "Categories", to: "/inventory/categories", icon: Tag, section: "Inventory", permission: "products.view" },
  { label: "Brands", to: "/inventory/brands", icon: Tags, section: "Inventory", permission: "products.view" },
  { label: "Suppliers", to: "/inventory/suppliers", icon: Truck, section: "Inventory", permission: "purchases.view" },
  { label: "Purchases", to: "/inventory/purchases", icon: ShoppingCart, section: "Inventory", permission: "purchases.view" },
  { label: "Stock In", to: "/inventory/stock-in", icon: PackagePlus, section: "Inventory", permission: "inventory.manage" },
  { label: "Stock Movements", to: "/inventory/stock-movements", icon: ArrowLeftRight, section: "Inventory", permission: "inventory.view" },
  { label: "Stock Adjustments", to: "/inventory/stock-adjustments", icon: ClipboardList, section: "Inventory", permission: "inventory.view" },
  { label: "Damaged Stock", to: "/inventory/damaged-stock", icon: AlertTriangle, section: "Inventory", permission: "inventory.manage" },
  { label: "Reports", to: "/inventory/reports", icon: BarChart3, section: "Inventory", permission: "inventory.view" },

  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Branches", to: "/branches", icon: Building2, section: "Management", permission: "branches.manage" },
  { label: "Staff & Permissions", to: "/staff", icon: UserCog, section: "Management", permission: "staff.manage" },
  { label: "Billing", to: "/subscription", icon: CreditCard },
  { label: "Settings", to: "/settings", icon: Settings, permission: "settings.manage" },
];

export const ADMIN_BUTTON_NAV_ITEM: NavItem = {
  label: "Admin",
  to: "/admin",
  icon: ShieldCheck,
};
