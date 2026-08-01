import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BellRing,
  Bell,
  Building2,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FilePlus2,
  Gauge,
  HandCoins,
  Landmark,
  LayoutDashboard,
  PackagePlus,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Tags,
  Percent,
  Repeat2,
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
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, section: "Overview" },
  { label: "Notifications", to: "/notifications", icon: Bell, section: "Overview" },

  { label: "POS", to: "/pos", icon: Store, section: "Sales", permission: "sales.create" },
  { label: "Sales", to: "/sales", icon: CircleDollarSign, section: "Sales", permission: "sales.view" },
  { label: "Recurring Invoices", to: "/sales/recurring", icon: Repeat2, section: "Sales", permission: "sales.view" },
  { label: "Customers", to: "/customers", icon: Users, section: "Sales", permission: "customers.view" },
  { label: "Promotions", to: "/promotions", icon: Percent, section: "Sales", permission: "promotions.manage" },

  { label: "Purchases", to: "/inventory/purchases", icon: ShoppingCart, section: "Purchasing & Expenses", permission: "purchases.view" },
  { label: "Suppliers", to: "/inventory/suppliers", icon: Truck, section: "Purchasing & Expenses", permission: "purchases.view" },
  { label: "Expenses", to: "/expenses", icon: WalletCards, section: "Purchasing & Expenses", permission: "expenses.view" },

  { label: "Products", to: "/products", icon: Boxes, section: "Inventory", permission: "products.view" },
  { label: "Categories", to: "/inventory/categories", icon: Tag, section: "Inventory", permission: "products.view" },
  { label: "Brands", to: "/inventory/brands", icon: Tags, section: "Inventory", permission: "products.view" },
  { label: "Stock In", to: "/inventory/stock-in", icon: PackagePlus, section: "Inventory", permission: "inventory.manage" },
  { label: "Stock Movements", to: "/inventory/stock-movements", icon: ArrowLeftRight, section: "Inventory", permission: "inventory.view" },
  { label: "Stock Adjustments", to: "/inventory/stock-adjustments", icon: ClipboardList, section: "Inventory", permission: "inventory.view" },
  { label: "Damaged Stock", to: "/inventory/damaged-stock", icon: AlertTriangle, section: "Inventory", permission: "inventory.manage" },

  { label: "Reports", to: "/reports", icon: BarChart3, section: "Reports", permission: "reports.view" },

  { label: "Overview", to: "/debts", icon: Gauge, section: "Debts & Credit", permission: "debts.view" },
  { label: "Customer Debts", to: "/debts/customers", icon: HandCoins, section: "Debts & Credit", permission: "debts.view" },
  { label: "Supplier Debts", to: "/debts/suppliers", icon: Landmark, section: "Debts & Credit", permission: "debts.view" },
  { label: "Record Debt", to: "/debts/new", icon: FilePlus2, section: "Debts & Credit", permission: "debts.create" },
  { label: "Debt Payments", to: "/debts/payments", icon: Receipt, section: "Debts & Credit", permission: "debts.view" },
  { label: "Reminders", to: "/debts/reminders", icon: BellRing, section: "Debts & Credit", permission: "debts.send_reminders" },
  { label: "Debt Reports", to: "/debts/reports", icon: FileBarChart, section: "Debts & Credit", permission: "debts.reports.view" },

  { label: "Branches", to: "/branches", icon: Building2, section: "Management", permission: "branches.manage" },
  { label: "Staff & Permissions", to: "/staff", icon: UserCog, section: "Management", permission: "staff.manage" },

  { label: "Billing", to: "/subscription", icon: CreditCard, section: "Account" },
  { label: "Settings", to: "/settings", icon: Settings, section: "Account", permission: "settings.manage" },
];

export const ADMIN_BUTTON_NAV_ITEM: NavItem = {
  label: "Admin",
  to: "/admin",
  icon: ShieldCheck,
};
