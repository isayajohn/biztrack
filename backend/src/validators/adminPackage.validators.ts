import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.");

const nullableTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => {
      if (value == null) return null;
      return value.length > 0 ? value : null;
    });

const booleanInput = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const moneyInput = z.coerce.number().finite().min(0);
const limitInput = z.coerce.number().int().min(0);
const trialDaysInput = z.coerce.number().int().min(0).max(3650);

export const adminPackageParamsSchema = z.object({
  id: z.string().uuid(),
});

export const packageStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const createPackageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  description: nullableTrimmedString(500),
  priceMonthly: moneyInput,
  priceYearly: moneyInput.optional().nullable(),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  trialDays: trialDaysInput.optional().default(0),
  maxBusinesses: limitInput,
  maxUsers: limitInput,
  maxProducts: limitInput,
  maxSalesPerMonth: limitInput,
  maxExpensesPerMonth: limitInput,
  allowReports: booleanInput,
  allowPdfExport: booleanInput,
  allowCsvExport: booleanInput,
  allowInventoryAlerts: booleanInput,
  allowAiInsights: booleanInput,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const updatePackageSchema = createPackageSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one package field is required.",
);

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
