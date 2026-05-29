import { z } from "zod";

const paginationQuerySchema = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
};

const booleanInput = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const nullableTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return null;
    return value.length > 0 ? value : null;
  });

export const adminSubscriptionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const businessPackageParamsSchema = z.object({
  businessId: z.string().uuid(),
});

export const adminSubscriptionsQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  businessId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "LIFETIME", "MANUAL"]).optional(),
  ...paginationQuerySchema,
});

export const assignSubscriptionSchema = z.object({
  businessId: z.string().uuid(),
  packageId: z.string().uuid(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]).optional().default("ACTIVE"),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "LIFETIME", "MANUAL"]).optional().default("MONTHLY"),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional().nullable(),
  trialEndsAt: z.coerce.date().optional().nullable(),
  notes: nullableTextSchema,
  allowInactivePackage: booleanInput.optional().default(false),
});

export const changeBusinessPackageSchema = assignSubscriptionSchema.omit({ businessId: true });

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]),
  allowInactivePackage: booleanInput.optional().default(false),
});

export const extendSubscriptionSchema = z.object({
  endsAt: z.coerce.date(),
  notes: nullableTextSchema,
});

export type AdminSubscriptionsQuery = z.infer<typeof adminSubscriptionsQuerySchema>;
export type AssignSubscriptionInput = z.infer<typeof assignSubscriptionSchema>;
export type ChangeBusinessPackageInput = z.infer<typeof changeBusinessPackageSchema>;
