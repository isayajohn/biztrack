export type Product = {
  id: string;
  name: string;
  sku?: string;
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
  buyingPrice: string;
  sellingPrice: string;
  stock: string;
  lowStockLevel: string;
  isActive: boolean;
};

export type FilterKey = "all" | "low-stock" | "out-of-stock" | "active" | "inactive";
