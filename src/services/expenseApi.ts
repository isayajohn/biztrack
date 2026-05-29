import { apiClient } from "./apiClient";
import type { Expense } from "../types/expense";

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getExpenses(): Promise<Expense[]> {
  return unwrap<Expense[]>(await apiClient.get("/expenses"));
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  return unwrap<Expense>(await apiClient.get(`/expenses/${id}`));
}

export async function createExpense(
  data: Omit<Expense, "id" | "createdAt" | "updatedAt">,
): Promise<Expense> {
  return unwrap<Expense>(await apiClient.post("/expenses", data));
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>,
): Promise<Expense | null> {
  return unwrap<Expense>(await apiClient.put(`/expenses/${id}`, data));
}

export async function deleteExpense(id: string): Promise<boolean> {
  await apiClient.delete(`/expenses/${id}`);
  return true;
}
