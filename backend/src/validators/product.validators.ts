import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().max(80).optional().or(z.literal("").transform(() => undefined)),
  buyingPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  lowStockLevel: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

export const createProductSchema = productSchema.refine(
  (data) => data.stock !== undefined || data.stockQuantity !== undefined,
  {
    message: "Stock quantity is required.",
    path: ["stockQuantity"],
  },
);

export const updateProductSchema = productSchema.partial().refine(
  (data: Partial<z.infer<typeof productSchema>>) => Object.keys(data).length > 0,
  {
    message: "At least one field is required.",
  },
);
