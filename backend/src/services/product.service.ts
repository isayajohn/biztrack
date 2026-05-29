import type { Product } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { money } from "../utils/mappers";
import { getDefaultBusinessId } from "./businessAccess.service";
import { checkPackageLimit } from "./packageLimit.service";

type ProductInput = {
  name: string;
  sku?: string;
  buyingPrice: number;
  sellingPrice: number;
  stock?: number;
  stockQuantity?: number;
  lowStockLevel: number;
  isActive: boolean;
};

function serializeProduct(product: Product) {
  return {
    ...product,
    buyingPrice: money(product.buyingPrice),
    sellingPrice: money(product.sellingPrice),
    stock: product.stockQuantity,
  };
}

function stockQuantity(input: Pick<ProductInput, "stock" | "stockQuantity">): number {
  return input.stockQuantity ?? input.stock ?? 0;
}

export async function listProducts(userId: string) {
  const businessId = await getDefaultBusinessId(userId);
  const products = await prisma.product.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  return products.map((product) => serializeProduct(product));
}

export async function getProduct(userId: string, id: string) {
  const businessId = await getDefaultBusinessId(userId);
  const product = await prisma.product.findFirst({ where: { id, businessId } });
  if (!product) throw new AppError("Product not found.", 404);
  return serializeProduct(product);
}

export async function createProduct(userId: string, input: ProductInput) {
  const businessId = await getDefaultBusinessId(userId);
  const product = await prisma.$transaction(async (tx) => {
    await checkPackageLimit(businessId, "maxProducts", { client: tx });

    return tx.product.create({
      data: {
        businessId,
        name: input.name,
        sku: input.sku,
        buyingPrice: input.buyingPrice,
        sellingPrice: input.sellingPrice,
        stockQuantity: stockQuantity(input),
        lowStockLevel: input.lowStockLevel,
        isActive: input.isActive,
      },
    });
  });
  return serializeProduct(product);
}

export async function updateProduct(userId: string, id: string, input: Partial<ProductInput>) {
  const businessId = await getDefaultBusinessId(userId);
  await getProduct(userId, id);
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.buyingPrice !== undefined ? { buyingPrice: input.buyingPrice } : {}),
      ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
      ...(input.stock !== undefined || input.stockQuantity !== undefined
        ? { stockQuantity: stockQuantity(input) }
        : {}),
      ...(input.lowStockLevel !== undefined ? { lowStockLevel: input.lowStockLevel } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  if (product.businessId !== businessId) throw new AppError("Product not found.", 404);
  return serializeProduct(product);
}

export async function deleteProduct(userId: string, id: string) {
  const businessId = await getDefaultBusinessId(userId);
  await getProduct(userId, id);
  const saleCount = await prisma.sale.count({ where: { businessId, productId: id } });
  if (saleCount > 0) {
    throw new AppError("Products with sales history cannot be deleted. Mark it inactive instead.", 400);
  }
  await prisma.product.delete({ where: { id } });
}
