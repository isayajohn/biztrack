import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be in YYYY-MM-DD format.",
});

export const dateRangeQuerySchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate must be before or equal to endDate.",
    path: ["startDate"],
  });

export const paymentMethodSchema = z.enum(["Cash", "Mobile Money", "Bank", "Credit"]);

export const optionalStringSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));
