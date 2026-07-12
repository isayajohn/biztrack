export type Product = {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  brandId?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  supplierId?: string | null;
  supplier?: { id: string; name: string } | null;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormData = {
  name: string;
  sku: string;
  barcode: string;
  brandId: string;
  categoryId: string;
  supplierId: string;
  buyingPrice: string;
  sellingPrice: string;
  stock: string;
  lowStockLevel: string;
  isActive: boolean;
};

export type FilterKey = "all" | "low-stock" | "out-of-stock" | "active" | "inactive";
