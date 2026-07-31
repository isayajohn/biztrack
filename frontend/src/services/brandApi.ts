import { apiClient } from "./apiClient";

export type Brand = { id: string; name: string; description: string | null; isActive: boolean; productCount: number; createdAt: string };
function unwrap<T>(response: { data: { data: T } }): T { return response.data.data; }
export async function getBrands(params?: { isActive?: boolean; search?: string }): Promise<Brand[]> { return unwrap<{ brands: Brand[] }>(await apiClient.get("/brands", { params })).brands ?? []; }
export async function createBrand(data: { name: string; description?: string }): Promise<Brand> { return unwrap<Brand>(await apiClient.post("/brands", data)); }
export async function updateBrand(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<Brand> { return unwrap<Brand>(await apiClient.put(`/brands/${id}`, data)); }
export async function deleteBrand(id: string): Promise<void> { await apiClient.delete(`/brands/${id}`); }
