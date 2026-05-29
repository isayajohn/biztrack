import type { Product, Sale } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { dateKey, fromPrismaPaymentMethod, money, toDateOnly, toPrismaPaymentMethod } from "../utils/mappers";
import { getDefaultBusinessId } from "./businessAccess.service";
import { checkPackageLimit } from "./packageLimit.service";

type SaleWithProduct = Sale & { product: Product | null };

type SaleInput = {
  productId?: string;
  quantity: number;
  unitPrice?: number;
  paymentMethod: string;
  saleDate: string;
  notes?: string;
};

function serializeSale(sale: SaleWithProduct) {
  return {
    ...sale,
    productName: sale.product?.name ?? "Manual sale",
    unitPrice: money(sale.unitPrice),
    totalAmount: money(sale.totalAmount),
    paymentMethod: fromPrismaPaymentMethod(sale.paymentMethod),
    saleDate: dateKey(sale.saleDate),
  };
}

async function getOwnedProduct(
  businessId: string,
  productId: string | undefined,
  tx: typeof prisma,
) {
  if (!productId) return null;
  const product = await tx.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new AppError("Product not found.", 404);
  return product;
}

export async function listSales(userId: string) {
  const businessId = await getDefaultBusinessId(userId);
  const sales = await prisma.sale.findMany({
    where: { businessId },
    include: { product: true },
    orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
  });
  return sales.map((sale) => serializeSale(sale));
}

export async function getSale(userId: string, id: string) {
  const businessId = await getDefaultBusinessId(userId);
  const sale = await prisma.sale.findFirst({ where: { id, businessId }, include: { product: true } });
  if (!sale) throw new AppError("Sale not found.", 404);
  return serializeSale(sale);
}

export async function createSale(userId: string, input: SaleInput) {
  const businessId = await getDefaultBusinessId(userId);
  return prisma.$transaction(async (tx) => {
    await checkPackageLimit(businessId, "maxSalesPerMonth", {
      client: tx,
      date: input.saleDate,
    });

    const product = await getOwnedProduct(businessId, input.productId, tx as typeof prisma);
    if (product && product.stockQuantity < input.quantity) {
      throw new AppError("Insufficient product stock.", 400);
    }

    const unitPrice = input.unitPrice ?? (product ? money(product.sellingPrice) : 0);
    if (unitPrice <= 0) throw new AppError("Unit price is required.", 400);

    const sale = await tx.sale.create({
      data: {
        businessId,
        productId: product?.id,
        quantity: input.quantity,
        unitPrice,
        totalAmount: unitPrice * input.quantity,
        paymentMethod: toPrismaPaymentMethod(input.paymentMethod),
        saleDate: toDateOnly(input.saleDate),
        notes: input.notes,
      },
      include: { product: true },
    });

    if (product) {
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: { decrement: input.quantity } },
      });
    }

    return serializeSale(sale);
  });
}

export async function updateSale(userId: string, id: string, input: Partial<SaleInput>) {
  const businessId = await getDefaultBusinessId(userId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sale.findFirst({
      where: { id, businessId },
      include: { product: true },
    });
    if (!existing) throw new AppError("Sale not found.", 404);

    if (existing.productId) {
      await tx.product.update({
        where: { id: existing.productId },
        data: { stockQuantity: { increment: existing.quantity } },
      });
    }

    const nextProduct = await getOwnedProduct(
      businessId,
      input.productId ?? existing.productId ?? undefined,
      tx as typeof prisma,
    );
    const nextQuantity = input.quantity ?? existing.quantity;
    if (nextProduct && nextProduct.stockQuantity < nextQuantity) {
      throw new AppError("Insufficient product stock.", 400);
    }

    const unitPrice =
      input.unitPrice ?? (input.productId ? money(nextProduct!.sellingPrice) : money(existing.unitPrice));

    const sale = await tx.sale.update({
      where: { id },
      data: {
        productId: nextProduct?.id,
        quantity: nextQuantity,
        unitPrice,
        totalAmount: unitPrice * nextQuantity,
        paymentMethod: input.paymentMethod
          ? toPrismaPaymentMethod(input.paymentMethod)
          : existing.paymentMethod,
        saleDate: input.saleDate ? toDateOnly(input.saleDate) : existing.saleDate,
        notes: input.notes ?? existing.notes,
      },
      include: { product: true },
    });

    if (nextProduct) {
      await tx.product.update({
        where: { id: nextProduct.id },
        data: { stockQuantity: { decrement: nextQuantity } },
      });
    }

    return serializeSale(sale);
  });
}

export async function deleteSale(userId: string, id: string) {
  const businessId = await getDefaultBusinessId(userId);
  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({ where: { id, businessId } });
    if (!sale) throw new AppError("Sale not found.", 404);
    await tx.sale.delete({ where: { id } });
    if (sale.productId) {
      await tx.product.update({
        where: { id: sale.productId },
        data: { stockQuantity: { increment: sale.quantity } },
      });
    }
  });
}
