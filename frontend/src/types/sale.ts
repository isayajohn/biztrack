// ─── Payment methods ───────────────────────────────────────────────────────────

export type PaymentMethod = "Cash" | "Mobile Money" | "Bank" | "Credit";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Mobile Money",
  "Bank",
  "Credit",
];

// ─── Sale line items (POS multi-product sales) ──────────────────────────────────

export type SaleItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

// ─── Core Sale type ────────────────────────────────────────────────────────────

export type Sale = {
  id: string;
  receiptNumber?: string;
  customerId?: string;
  customerName?: string;
  promotionId?: string;
  promotionDiscount: number;
  productId: string | null; // null for POS multi-item sales — see `items`
  productName: string; // denormalized — survives product renames / deletes; "POS · N items" for cart sales
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
  items?: SaleItem[]; // populated for POS sales, empty/absent otherwise
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
