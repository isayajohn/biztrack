// ─── Categories ────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "Stock Purchase"
  | "Rent"
  | "Transport"
  | "Salary"
  | "Electricity"
  | "Internet"
  | "Food"
  | "Marketing"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Stock Purchase",
  "Rent",
  "Transport",
  "Salary",
  "Electricity",
  "Internet",
  "Food",
  "Marketing",
  "Other",
];

// ─── Payment methods ───────────────────────────────────────────────────────────

export type ExpensePaymentMethod = "Cash" | "Mobile Money" | "Bank" | "Credit";

export const EXPENSE_PAYMENT_METHODS: ExpensePaymentMethod[] = [
  "Cash",
  "Mobile Money",
  "Bank",
  "Credit",
];

// ─── Core Expense type ─────────────────────────────────────────────────────────

export type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Form shape ────────────────────────────────────────────────────────────────

export type ExpenseFormData = {
  category: ExpenseCategory;
  description: string;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  notes: string;
};

// ─── Filter types ──────────────────────────────────────────────────────────────

export type ExpenseDateFilter = "all" | "today" | "week" | "month";
export type ExpenseCategoryFilter = "all" | ExpenseCategory;
export type ExpensePaymentFilter = "all" | ExpensePaymentMethod;
