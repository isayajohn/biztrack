// ─── Types ────────────────────────────────────────────────────────────────────

export type Sale = {
  id: string;
  item: string;
  qty: number;
  amount: number;
  time: string;
};

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  time: string;
};

export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  lowStockLevel: number;
  unit: string;
};

export type ChartDataPoint = {
  day: string;
  sales: number;
  expenses: number;
};

// ─── Summary data ─────────────────────────────────────────────────────────────

export const TODAY_SUMMARY = {
  sales: 248,
  expenses: 71,
  profit: 177,
} as const;

export const MONTHLY_SUMMARY = {
  sales: 4820,
  expenses: 1930,
  profit: 2890,
} as const;

// ─── Chart data (last 7 days) ─────────────────────────────────────────────────

export const CHART_DATA: ChartDataPoint[] = [
  { day: "Mon", sales: 180, expenses: 65 },
  { day: "Tue", sales: 220, expenses: 85 },
  { day: "Wed", sales: 195, expenses: 110 },
  { day: "Thu", sales: 310, expenses: 95 },
  { day: "Fri", sales: 280, expenses: 75 },
  { day: "Sat", sales: 420, expenses: 130 },
  { day: "Sun", sales: 248, expenses: 71 },
];

// ─── Recent sales ──────────────────────────────────────────────────────────────

export const RECENT_SALES: Sale[] = [
  { id: "1", item: "Rice 5kg bags", qty: 2, amount: 34, time: "10:24 AM" },
  { id: "2", item: "Phone repair service", qty: 1, amount: 45, time: "09:11 AM" },
  { id: "3", item: "Tomato crate", qty: 3, amount: 90, time: "08:55 AM" },
  { id: "4", item: "Vegetable oil 1L", qty: 5, amount: 50, time: "Yesterday" },
  { id: "5", item: "Sugar 2kg", qty: 4, amount: 29, time: "Yesterday" },
];

// ─── Recent expenses ──────────────────────────────────────────────────────────

export const RECENT_EXPENSES: Expense[] = [
  { id: "1", description: "Cooking oil stock", category: "Stock", amount: 22, time: "09:30 AM" },
  { id: "2", description: "Monthly rent", category: "Rent", amount: 150, time: "Yesterday" },
  { id: "3", description: "Delivery transport", category: "Transport", amount: 15, time: "Yesterday" },
  { id: "4", description: "Rice 50kg bags", category: "Stock", amount: 80, time: "2 days ago" },
  { id: "5", description: "Electricity bill", category: "Utilities", amount: 35, time: "3 days ago" },
];

// ─── Low stock products ───────────────────────────────────────────────────────

export const LOW_STOCK_PRODUCTS: LowStockProduct[] = [
  { id: "1", name: "Rice 5kg bags", stock: 3, lowStockLevel: 10, unit: "bags" },
  { id: "2", name: "Vegetable oil 1L", stock: 5, lowStockLevel: 15, unit: "bottles" },
  { id: "3", name: "Sugar 2kg", stock: 2, lowStockLevel: 8, unit: "bags" },
];
