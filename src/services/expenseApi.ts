import { apiClient } from "./apiClient";
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from "../types/expense";

type ApiExpenseCategory =
  | "STOCK_PURCHASE"
  | "RENT"
  | "TRANSPORT"
  | "SALARY"
  | "ELECTRICITY"
  | "INTERNET"
  | "FOOD"
  | "MARKETING"
  | "OTHER";

type ApiExpensePaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK" | "CREDIT";

type ApiExpense = Omit<Expense, "category" | "paymentMethod"> & {
  category: ExpenseCategory | ApiExpenseCategory;
  paymentMethod: ExpensePaymentMethod | ApiExpensePaymentMethod;
};

type ExpensesResponse = ApiExpense[] | { expenses?: ApiExpense[] };

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

function toApiCategory(category: ExpenseCategory | ApiExpenseCategory): ApiExpenseCategory {
  if (category === "Stock Purchase" || category === "STOCK_PURCHASE") return "STOCK_PURCHASE";
  return category.toString().toUpperCase() as ApiExpenseCategory;
}

function fromApiCategory(category: ExpenseCategory | ApiExpenseCategory): ExpenseCategory {
  if (category === "STOCK_PURCHASE" || category === "Stock Purchase") return "Stock Purchase";
  const normalized = category.toString().toLowerCase();
  return (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as ExpenseCategory;
}

function toApiPaymentMethod(method: ExpensePaymentMethod | ApiExpensePaymentMethod): ApiExpensePaymentMethod {
  if (method === "Cash" || method === "CASH") return "CASH";
  if (method === "Mobile Money" || method === "MOBILE_MONEY") return "MOBILE_MONEY";
  if (method === "Bank" || method === "BANK") return "BANK";
  return "CREDIT";
}

function fromApiPaymentMethod(method: ExpensePaymentMethod | ApiExpensePaymentMethod): ExpensePaymentMethod {
  if (method === "CASH" || method === "Cash") return "Cash";
  if (method === "MOBILE_MONEY" || method === "Mobile Money") return "Mobile Money";
  if (method === "BANK" || method === "Bank") return "Bank";
  return "Credit";
}

function normalizeExpense(expense: ApiExpense): Expense {
  return {
    id: expense.id,
    category: fromApiCategory(expense.category),
    description: expense.description,
    amount: Number(expense.amount ?? 0),
    paymentMethod: fromApiPaymentMethod(expense.paymentMethod),
    expenseDate: expense.expenseDate,
    notes: expense.notes,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

function normalizeExpenses(payload: ExpensesResponse): Expense[] {
  const expenses = Array.isArray(payload) ? payload : payload.expenses;
  return Array.isArray(expenses) ? expenses.map(normalizeExpense) : [];
}

function serializeExpense<T extends Partial<Expense>>(data: T) {
  return {
    ...data,
    category: data.category ? toApiCategory(data.category) : undefined,
    paymentMethod: data.paymentMethod ? toApiPaymentMethod(data.paymentMethod) : undefined,
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const payload = unwrap<ExpensesResponse>(await apiClient.get("/expenses"));
  return normalizeExpenses(payload);
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  const expense = unwrap<ApiExpense>(await apiClient.get(`/expenses/${id}`));
  return normalizeExpense(expense);
}

export async function createExpense(
  data: Omit<Expense, "id" | "createdAt" | "updatedAt">,
): Promise<Expense> {
  const expense = unwrap<ApiExpense>(await apiClient.post("/expenses", serializeExpense(data)));
  return normalizeExpense(expense);
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>,
): Promise<Expense | null> {
  const expense = unwrap<ApiExpense>(await apiClient.put(`/expenses/${id}`, serializeExpense(data)));
  return normalizeExpense(expense);
}

export async function deleteExpense(id: string): Promise<boolean> {
  await apiClient.delete(`/expenses/${id}`);
  return true;
}
