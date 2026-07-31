import { apiClient } from "./apiClient";

export type DebtType = "CUSTOMER" | "SUPPLIER";
export type DebtStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "PAID"
  | "DISPUTED"
  | "WRITTEN_OFF"
  | "CANCELLED";
export type DebtSource = "AUTO_SALE" | "AUTO_PURCHASE" | "MANUAL";
export type DebtPaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK" | "OTHER";
export type ReminderChannel = "SMS" | "WHATSAPP" | "EMAIL" | "IN_APP";
export type ReminderTriggerType = "BEFORE_DUE" | "ON_DUE" | "AFTER_DUE_RECURRING" | "MANUAL";
export type ReminderStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";
export type OverduePeriod = "NOT_DUE" | "1_7" | "8_30" | "31_60" | "61_90" | "OVER_90";

export type Debt = {
  id: string;
  debtNumber: string;
  type: DebtType;
  status: DebtStatus;
  source: DebtSource;
  businessId: string;
  branchId: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  supplier: { id: string; name: string; phone: string | null } | null;
  saleId: string | null;
  purchaseOrderId: string | null;
  originalAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  debtDate: string;
  dueDate: string | null;
  description: string | null;
  notes: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DebtPayment = {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: DebtPaymentMethod;
  transactionReference: string | null;
  notes: string | null;
  isReversed: boolean;
  reversalReason: string | null;
  createdAt: string;
};

export type DebtReminder = {
  id: string;
  debtId: string;
  channel: ReminderChannel;
  triggerType: ReminderTriggerType;
  status: ReminderStatus;
  scheduledFor: string;
  sentAt: string | null;
  failureReason: string | null;
  messageSnapshot?: string | null;
};

export type DebtAttachment = {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
};

export type DebtActivity = {
  id: string;
  action: string;
  actor: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type DebtDetail = Debt & {
  sale: { id: string; receiptNumber: string; totalAmount: number } | null;
  purchaseOrder: { id: string; orderNumber: string; totalAmount: number } | null;
  payments: DebtPayment[];
  reminders: DebtReminder[];
  attachments: DebtAttachment[];
};

export type DebtSettings = {
  allowOverpayments: boolean;
  remindDaysBefore: number[];
  remindOnDueDate: boolean;
  remindAfterDueRepeatDays: number;
  remindAfterDueMaxTimes: number;
  enabledChannels: ReminderChannel[];
};

export type DebtReminderTemplate = {
  channel: ReminderChannel;
  triggerType: Exclude<ReminderTriggerType, "MANUAL">;
  subject: string | null;
  body: string;
  isActive: boolean;
  isCustomized: boolean;
};

export type DebtOverview = {
  totalCustomerDebts: number;
  totalSupplierDebts: number;
  customerOverdueAmount: number;
  supplierOverdueAmount: number;
  collectedThisMonth: number;
  paidToSuppliersThisMonth: number;
  debtsDueToday: number;
  debtsDueWithin7Days: number;
  recentPayments: {
    id: string;
    debtNumber: string | null;
    party: string | null;
    amount: number;
    paymentDate: string;
    paymentMethod: DebtPaymentMethod;
  }[];
  topCustomers: { customerId: string; name: string | null; outstandingBalance: number }[];
  topSuppliers: { supplierId: string; name: string | null; outstandingBalance: number }[];
};

export type AgingBucket = { label: string; count: number; amount: number };

export type DebtListFilters = {
  type?: DebtType;
  customerId?: string;
  supplierId?: string;
  branchId?: string;
  status?: DebtStatus;
  debtDateFrom?: string;
  debtDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overduePeriod?: OverduePeriod;
  search?: string;
  sortBy?: "debtDate" | "dueDate" | "originalAmount" | "outstandingBalance" | "debtNumber" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

type DebtListPayload = { debts: Debt[]; total: number; page: number; limit: number };

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getDebts(filters: DebtListFilters = {}): Promise<DebtListPayload> {
  return unwrap<DebtListPayload>(await apiClient.get("/debts", { params: filters }));
}

export async function getDebtOverview(): Promise<DebtOverview> {
  return unwrap<DebtOverview>(await apiClient.get("/debts/overview"));
}

export async function getDebtAgingReport(type?: DebtType): Promise<{ buckets: AgingBucket[] }> {
  return unwrap(await apiClient.get("/debts/aging-report", { params: { type } }));
}

export async function getDebt(id: string): Promise<DebtDetail> {
  return unwrap<DebtDetail>(await apiClient.get(`/debts/${id}`));
}

export async function createDebt(data: {
  type: DebtType;
  customerId?: string;
  supplierId?: string;
  originalAmount: number;
  debtDate: string;
  dueDate?: string;
  description?: string;
  notes?: string;
  status?: "DRAFT" | "ACTIVE";
}): Promise<Debt> {
  return unwrap<Debt>(await apiClient.post("/debts", data));
}

export async function updateDebt(
  id: string,
  data: Partial<{ dueDate: string | null; description: string; notes: string }>,
): Promise<Debt> {
  return unwrap<Debt>(await apiClient.put(`/debts/${id}`, data));
}

export async function deleteDebt(id: string): Promise<void> {
  await apiClient.delete(`/debts/${id}`);
}

export async function cancelDebt(id: string, reason: string): Promise<Debt> {
  return unwrap<Debt>(await apiClient.post(`/debts/${id}/cancel`, { reason }));
}

export async function writeOffDebt(id: string, reason: string): Promise<Debt> {
  return unwrap<Debt>(await apiClient.post(`/debts/${id}/write-off`, { reason }));
}

export async function disputeDebt(id: string, reason: string): Promise<Debt> {
  return unwrap<Debt>(await apiClient.post(`/debts/${id}/dispute`, { reason }));
}

export async function getDebtActivity(id: string): Promise<DebtActivity[]> {
  const data = unwrap<{ activity: DebtActivity[] }>(await apiClient.get(`/debts/${id}/activity`));
  return data.activity;
}

export async function uploadDebtAttachment(id: string, file: File): Promise<DebtAttachment> {
  const form = new FormData();
  form.append("file", file);
  return unwrap<DebtAttachment>(
    await apiClient.post(`/debts/${id}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}

export function debtAttachmentUrl(debtId: string, attachmentId: string): string {
  const baseURL = apiClient.defaults.baseURL ?? "";
  return `${baseURL}/debts/${debtId}/attachments/${attachmentId}`;
}

export async function recordDebtPayment(
  debtId: string,
  data: {
    amount: number;
    paymentDate: string;
    paymentMethod: DebtPaymentMethod;
    transactionReference?: string;
    notes?: string;
    attachment?: File;
  },
): Promise<{ payment: DebtPayment; debt: Pick<Debt, "id" | "status" | "totalPaid" | "outstandingBalance"> }> {
  const { attachment, ...rest } = data;
  if (attachment) {
    const form = new FormData();
    Object.entries(rest).forEach(([key, value]) => form.append(key, String(value)));
    form.append("attachment", attachment);
    return unwrap(
      await apiClient.post(`/debts/${debtId}/payments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  }
  return unwrap(await apiClient.post(`/debts/${debtId}/payments`, rest));
}

export type DebtPaymentLedgerRow = DebtPayment & {
  debtNumber: string | null;
  debtType: DebtType | null;
  party: string | null;
};

export async function getDebtPayments(filters: {
  debtId?: string;
  type?: DebtType;
  paymentMethod?: DebtPaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  includeReversed?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<{ payments: DebtPaymentLedgerRow[]; total: number; page: number; limit: number }> {
  return unwrap(await apiClient.get("/debt-payments", { params: filters }));
}

export async function reverseDebtPayment(paymentId: string, reason: string): Promise<DebtPayment> {
  return unwrap<DebtPayment>(
    await apiClient.delete(`/debt-payments/${paymentId}`, { data: { reason } }),
  );
}

export async function getDebtReminders(debtId: string): Promise<DebtReminder[]> {
  const data = unwrap<{ reminders: DebtReminder[] }>(await apiClient.get(`/debts/${debtId}/reminders`));
  return data.reminders;
}

export async function scheduleDebtReminder(
  debtId: string,
  data: { channel: ReminderChannel; scheduledFor?: string },
): Promise<DebtReminder> {
  return unwrap<DebtReminder>(await apiClient.post(`/debts/${debtId}/reminders`, data));
}

export async function sendDebtReminderNow(debtId: string, reminderId: string): Promise<DebtReminder> {
  return unwrap<DebtReminder>(await apiClient.post(`/debts/${debtId}/reminders/${reminderId}/send-now`));
}

export async function getDebtSettings(): Promise<DebtSettings> {
  return unwrap<DebtSettings>(await apiClient.get("/debt-settings"));
}

export async function updateDebtSettings(data: Partial<DebtSettings>): Promise<DebtSettings> {
  return unwrap<DebtSettings>(await apiClient.put("/debt-settings", data));
}

export async function getDebtReminderTemplates(): Promise<{
  templates: DebtReminderTemplate[];
  supportedVariables: string[];
}> {
  return unwrap(await apiClient.get("/debt-reminder-templates"));
}

export async function updateDebtReminderTemplate(
  channel: ReminderChannel,
  trigger: Exclude<ReminderTriggerType, "MANUAL">,
  data: { subject?: string; body: string; isActive?: boolean },
): Promise<DebtReminderTemplate> {
  return unwrap<DebtReminderTemplate>(
    await apiClient.put(`/debt-reminder-templates/${channel}/${trigger}`, data),
  );
}

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PARTIALLY_PAID: "Partially paid",
  OVERDUE: "Overdue",
  PAID: "Paid",
  DISPUTED: "Disputed",
  WRITTEN_OFF: "Written off",
  CANCELLED: "Cancelled",
};

export const OVERDUE_PERIOD_LABELS: Record<OverduePeriod, string> = {
  NOT_DUE: "Not yet due",
  "1_7": "1-7 days overdue",
  "8_30": "8-30 days overdue",
  "31_60": "31-60 days overdue",
  "61_90": "61-90 days overdue",
  OVER_90: "More than 90 days overdue",
};
