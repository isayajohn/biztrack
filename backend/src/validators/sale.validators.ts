import { z } from "zod";
import { dateStringSchema, optionalStringSchema, paymentMethodSchema } from "./common.validators";

export const createSaleSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  paymentMethod: paymentMethodSchema,
  saleDate: dateStringSchema,
  notes: optionalStringSchema,
});

export const updateSaleSchema = createSaleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required.",
  },
);
