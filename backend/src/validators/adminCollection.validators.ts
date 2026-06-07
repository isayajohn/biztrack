import { z } from "zod";

export const adminCollectionsQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.enum(["PENDING", "PAID", "FAILED", "CANCELLED"]).optional(),
  packageId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type AdminCollectionsQuery = z.infer<typeof adminCollectionsQuerySchema>;
