import { apiClient } from "./apiClient";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: number;
  creditBalance: number;
  availableCredit: number;
  isActive: boolean;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerPayment = {
  id: string;
  customerId: string;
  saleId: string | null;
  amount: number;
  paymentMethod: "CASH" | "MOBILE_MONEY" | "BANK";
  paymentDate: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type CreditSale = {
  id: string;
  receiptNumber: string | null;
  date: string;
  total: number;
  paid: number;
  balance: number;
  dueDate: string | null;
};

type CustomerListPayload = {
  customers: Customer[];
  total: number;
  totalCreditOutstanding: number;
};

type CustomerStatement = {
  customer: Customer;
  creditSales: CreditSale[];
  payments: CustomerPayment[];
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getCustomers(params?: {
  search?: string;
  isActive?: boolean;
  withCredit?: boolean;
}): Promise<CustomerListPayload> {
  return unwrap<CustomerListPayload>(await apiClient.get("/customers", { params }));
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}): Promise<Customer> {
  return unwrap<Customer>(await apiClient.post("/customers", data));
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    creditLimit: number;
    isActive: boolean;
  }>,
): Promise<Customer> {
  return unwrap<Customer>(await apiClient.put(`/customers/${id}`, data));
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

export async function getCustomerStatement(id: string): Promise<CustomerStatement> {
  return unwrap<CustomerStatement>(await apiClient.get(`/customers/${id}/statement`));
}

export async function recordCustomerPayment(
  id: string,
  data: {
    amount: number;
    paymentMethod: "CASH" | "MOBILE_MONEY" | "BANK";
    paymentDate: string;
    saleId?: string;
    reference?: string;
    notes?: string;
  },
): Promise<{ customer: Customer; payment: CustomerPayment }> {
  return unwrap(await apiClient.post(`/customers/${id}/payments`, data));
}
