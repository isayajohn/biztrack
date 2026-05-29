import { apiClient } from "./apiClient";
import type { Sale } from "../types/sale";

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getSales(): Promise<Sale[]> {
  return unwrap<Sale[]>(await apiClient.get("/sales"));
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  return unwrap<Sale>(await apiClient.get(`/sales/${id}`));
}

export async function createSale(
  data: Omit<Sale, "id" | "createdAt" | "updatedAt">,
): Promise<Sale> {
  return unwrap<Sale>(await apiClient.post("/sales", data));
}

export async function updateSale(
  id: string,
  data: Partial<Omit<Sale, "id" | "createdAt">>,
): Promise<Sale | null> {
  return unwrap<Sale>(await apiClient.put(`/sales/${id}`, data));
}

export async function deleteSale(id: string): Promise<boolean> {
  await apiClient.delete(`/sales/${id}`);
  return true;
}
