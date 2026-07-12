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
  receiptNumber?: string;
  customerId?: string;
  customerName?: string;
  promotionId?: string;
  promotionDiscount: number;
  productId: string;
  productName: string; // denormalized — survives product renames / deletes
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentDueDate?: string;
  paymentMethod: PaymentMethod;
  saleDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Form shape ────────────────────────────────────────────────────────────────

export type SaleFormData = {
  customerId: string;
  promotionId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
  paidAmount: string;
  paymentDueDate: string;
  paymentMethod: PaymentMethod;
  saleDate: string;
  notes: string;
};

// ─── Filter types ──────────────────────────────────────────────────────────────

export type SaleDateFilter = "all" | "today" | "week" | "month";
export type SalePaymentFilter = "all" | PaymentMethod;
