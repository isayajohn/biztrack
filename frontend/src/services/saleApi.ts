import { apiClient } from "./apiClient";
import type { PaymentMethod, Sale, SaleItem } from "../types/sale";

type ApiPaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK" | "CREDIT";

type ApiSale = Omit<Sale, "productName" | "paymentMethod" | "items"> & {
  productName?: string | null;
  paymentMethod: PaymentMethod | ApiPaymentMethod;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
  } | null;
  items?: SaleItem[] | null;
};

type SalesResponse = ApiSale[] | { sales?: ApiSale[] };

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

function toApiPaymentMethod(method: PaymentMethod | ApiPaymentMethod): ApiPaymentMethod {
  if (method === "Cash" || method === "CASH") return "CASH";
  if (method === "Mobile Money" || method === "MOBILE_MONEY") return "MOBILE_MONEY";
  if (method === "Bank" || method === "BANK") return "BANK";
  return "CREDIT";
}

function fromApiPaymentMethod(method: PaymentMethod | ApiPaymentMethod): PaymentMethod {
  if (method === "CASH" || method === "Cash") return "Cash";
  if (method === "MOBILE_MONEY" || method === "Mobile Money") return "Mobile Money";
  if (method === "BANK" || method === "Bank") return "Bank";
  return "Credit";
}

function normalizeSale(sale: ApiSale): Sale {
  return {
    id: sale.id,
    productId: sale.productId,
    productName: sale.productName ?? sale.product?.name ?? "Unassigned product",
    receiptNumber: sale.receiptNumber,
    customerId: sale.customerId,
    customerName: sale.customerName,
    promotionId: sale.promotionId,
    promotionDiscount: Number(sale.promotionDiscount ?? 0),
    quantity: Number(sale.quantity ?? 0),
    unitPrice: Number(sale.unitPrice ?? 0),
    totalAmount: Number(sale.totalAmount ?? 0),
    discount: Number(sale.discount ?? 0),
    taxRate: Number(sale.taxRate ?? 0),
    taxAmount: Number(sale.taxAmount ?? 0),
    paidAmount: Number(sale.paidAmount ?? 0),
    balanceDue: Number(sale.balanceDue ?? 0),
    paymentDueDate: sale.paymentDueDate,
    paymentMethod: fromApiPaymentMethod(sale.paymentMethod),
    saleDate: sale.saleDate,
    notes: sale.notes,
    items: sale.items ?? undefined,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}

function normalizeSales(payload: SalesResponse): Sale[] {
  const sales = Array.isArray(payload) ? payload : payload.sales;
  return Array.isArray(sales) ? sales.map(normalizeSale) : [];
}

function serializeSale<T extends Partial<Sale>>(data: T) {
  return {
    ...data,
    paymentMethod: data.paymentMethod ? toApiPaymentMethod(data.paymentMethod) : undefined,
  };
}

export async function getSales(): Promise<Sale[]> {
  const payload = unwrap<SalesResponse>(await apiClient.get("/sales"));
  return normalizeSales(payload);
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const sale = unwrap<ApiSale>(await apiClient.get(`/sales/${id}`));
  return normalizeSale(sale);
}

export async function createSale(
  data: Omit<Sale, "id" | "createdAt" | "updatedAt" | "balanceDue" | "discount" | "promotionDiscount" | "taxRate" | "taxAmount" | "paidAmount"> & {
    discount?: number;
    taxRate?: number;
    paidAmount?: number;
  },
): Promise<Sale> {
  const sale = unwrap<ApiSale>(await apiClient.post("/sales", serializeSale(data)));
  return normalizeSale(sale);
}

export type PosCartItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export async function createPosSale(data: {
  items: PosCartItem[];
  customerId?: string;
  promotionId?: string;
  discount?: number;
  taxRate?: number;
  paidAmount?: number;
  paymentDueDate?: string;
  paymentMethod: PaymentMethod;
  saleDate: string;
}): Promise<Sale> {
  const sale = unwrap<ApiSale>(
    await apiClient.post("/sales/pos", {
      ...data,
      paymentMethod: toApiPaymentMethod(data.paymentMethod),
    }),
  );
  return normalizeSale(sale);
}

export async function updateSale(
  id: string,
  data: Partial<Omit<Sale, "id" | "createdAt">>,
): Promise<Sale | null> {
  const sale = unwrap<ApiSale>(await apiClient.put(`/sales/${id}`, serializeSale(data)));
  return normalizeSale(sale);
}

export async function deleteSale(id: string): Promise<boolean> {
  await apiClient.delete(`/sales/${id}`);
  return true;
}
