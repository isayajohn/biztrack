import { apiClient } from "./apiClient";
import type { Product } from "../types/product";

type ApiProduct = Omit<Product, "stock"> & {
  stock?: number;
  stockQuantity?: number;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

function normalizeProduct(product: ApiProduct): Product {
  return {
    ...product,
    stock: product.stock ?? product.stockQuantity ?? 0,
  };
}

export async function getProducts(): Promise<Product[]> {
  const products = unwrap<ApiProduct[]>(await apiClient.get("/products"));
  return products.map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const product = unwrap<ApiProduct>(await apiClient.get(`/products/${id}`));
  return normalizeProduct(product);
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">,
): Promise<Product> {
  const product = unwrap<ApiProduct>(
    await apiClient.post("/products", {
      ...data,
      stockQuantity: data.stock,
    }),
  );
  return normalizeProduct(product);
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>,
): Promise<Product | null> {
  const product = unwrap<ApiProduct>(
    await apiClient.put(`/products/${id}`, {
      ...data,
      ...(data.stock !== undefined ? { stockQuantity: data.stock } : {}),
    }),
  );
  return normalizeProduct(product);
}

export async function deleteProduct(id: string): Promise<boolean> {
  await apiClient.delete(`/products/${id}`);
  return true;
}
