// ─── Payment methods ───────────────────────────────────────────────────────────

export type PaymentMethod = "Cash" | "Mobile Money" | "Bank" | "Credit";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Mobile Money",
  "Bank",
  "Credit",
];

// ─── Core Sale type ────────────────────────────────────────────────────────────

export type Sale = {
  id: string;
  productId: string;
  productName: string; // denormalized — survives product renames / deletes
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  saleDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Form shape ────────────────────────────────────────────────────────────────

export type SaleFormData = {
  productId: string;
  quantity: string;
  unitPrice: string;
  paymentMethod: PaymentMethod;
  saleDate: string;
  notes: string;
};

// ─── Filter types ──────────────────────────────────────────────────────────────

export type SaleDateFilter = "all" | "today" | "week" | "month";
export type SalePaymentFilter = "all" | PaymentMethod;
