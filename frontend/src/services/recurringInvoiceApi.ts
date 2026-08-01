import { apiClient } from "./apiClient";

export type RecurringInvoiceFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY";
export type RecurringInvoiceStatus = "ACTIVE" | "PAUSED";
export type RecurringInvoicePaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK" | "CREDIT";

export const FREQUENCY_LABELS: Record<RecurringInvoiceFrequency, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

export type RecurringInvoiceItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type RecurringInvoice = {
  id: string;
  businessId: string;
  branchId: string | null;
  customerId: string;
  customerName: string | null;
  frequency: RecurringInvoiceFrequency;
  startDate: string;
  nextRunDate: string;
  lastRunDate: string | null;
  endDate: string | null;
  paymentMethod: RecurringInvoicePaymentMethod;
  discount: number;
  taxRate: number | null;
  notes: string | null;
  status: RecurringInvoiceStatus;
  generatedCount: number;
  subtotal: number;
  items: RecurringInvoiceItem[];
  createdAt: string;
  updatedAt: string;
};

export type RecurringInvoiceInput = {
  customerId: string;
  frequency: RecurringInvoiceFrequency;
  startDate: string;
  endDate?: string | null;
  paymentMethod: RecurringInvoicePaymentMethod;
  discount?: number;
  taxRate?: number | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getRecurringInvoices(filters: { status?: RecurringInvoiceStatus; customerId?: string } = {}): Promise<RecurringInvoice[]> {
  const data = unwrap<{ recurringInvoices: RecurringInvoice[] }>(await apiClient.get("/recurring-invoices", { params: filters }));
  return data.recurringInvoices;
}

export async function getRecurringInvoice(id: string): Promise<RecurringInvoice> {
  return unwrap<RecurringInvoice>(await apiClient.get(`/recurring-invoices/${id}`));
}

export async function createRecurringInvoice(data: RecurringInvoiceInput): Promise<RecurringInvoice> {
  return unwrap<RecurringInvoice>(await apiClient.post("/recurring-invoices", data));
}

export async function updateRecurringInvoice(id: string, data: RecurringInvoiceInput): Promise<RecurringInvoice> {
  return unwrap<RecurringInvoice>(await apiClient.put(`/recurring-invoices/${id}`, data));
}

export async function setRecurringInvoiceStatus(id: string, status: RecurringInvoiceStatus): Promise<RecurringInvoice> {
  return unwrap<RecurringInvoice>(await apiClient.put(`/recurring-invoices/${id}/status`, { status }));
}

export async function runRecurringInvoiceNow(id: string): Promise<{ recurringInvoice: RecurringInvoice; saleId: string; receiptNumber: string }> {
  return unwrap(await apiClient.post(`/recurring-invoices/${id}/run-now`));
}

export async function deleteRecurringInvoice(id: string): Promise<void> {
  await apiClient.delete(`/recurring-invoices/${id}`);
}
