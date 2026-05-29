import { z } from "zod";

const paginationQuerySchema = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
};

export const adminUserParamsSchema = z.object({
  id: z.string().uuid(),
});

export const adminBusinessParamsSchema = z.object({
  id: z.string().uuid(),
});

export const adminPackageParamsSchema = z.object({
  id: z.string().uuid(),
});

export const adminSubscriptionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  role: z.enum(["USER", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  ...paginationQuerySchema,
});

export const adminBusinessesQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  country: z.string().trim().max(120).optional().default(""),
  ...paginationQuerySchema,
});

export const adminAuditLogsQuerySchema = z.object({
  action: z.string().trim().max(80).optional(),
  actor: z.string().trim().max(120).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().trim().max(240).optional().default(""),
  ...paginationQuerySchema,
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "SUPER_ADMIN"]),
});

export const brandingSchema = z.object({
  logoDataUrl: z.string().trim().min(1).max(4_000_000),
  logoFileName: z.string().trim().max(255).optional().nullable(),
  logoMimeType: z.string().trim().max(100).optional().nullable(),
});

const packagePayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80)
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
  trialDays: z.coerce.number().int().min(0).max(3650).optional().default(0),
  maxBusinesses: z.coerce.number().int().min(0),
  maxUsers: z.coerce.number().int().min(0),
  maxProducts: z.coerce.number().int().min(0),
  maxSalesPerMonth: z.coerce.number().int().min(0),
  maxExpensesPerMonth: z.coerce.number().int().min(0),
  allowReports: z.coerce.boolean(),
  allowPdfExport: z.coerce.boolean(),
  allowCsvExport: z.coerce.boolean(),
  allowInventoryAlerts: z.coerce.boolean(),
  allowAiInsights: z.coerce.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const createPackageSchema = packagePayloadSchema;

export const updatePackageSchema = packagePayloadSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one package field is required.",
);

export const adminSubscriptionsQuerySchema = z.object({
  businessId: z.string().uuid().optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]).optional(),
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
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]),
});

export const extendSubscriptionSchema = z.object({
  endsAt: z.coerce.date(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const contentBlockSchema = z.array(z.record(z.unknown()));

export const landingPageContentSchema = z.object({
  heroTitle: z.string().trim().min(2).max(160),
  heroSubtitle: z.string().trim().min(2).max(500),
  primaryButtonText: z.string().trim().min(1).max(80),
  primaryButtonUrl: z.string().trim().min(1).max(240),
  secondaryButtonText: z.string().trim().min(1).max(80),
  secondaryButtonUrl: z.string().trim().min(1).max(240),
  features: contentBlockSchema,
  pricing: contentBlockSchema,
  faqs: contentBlockSchema,
  testimonials: contentBlockSchema.optional().nullable(),
  footerLinks: contentBlockSchema.optional().nullable(),
  seoTitle: z.string().trim().max(160).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
  isPublished: z.coerce.boolean().optional().default(true),
});

export const emailConfigSchema = z.object({
  provider: z.enum(["SMTP", "API", "CUSTOM"]),
  host: z.string().trim().max(240).optional().nullable(),
  port: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  username: z.string().trim().max(240).optional().nullable(),
  password: z.string().max(2000).optional().nullable(),
  apiKey: z.string().max(2000).optional().nullable(),
  clearPassword: z.coerce.boolean().optional().default(false),
  clearApiKey: z.coerce.boolean().optional().default(false),
  fromName: z.string().trim().min(1).max(120),
  fromEmail: z.string().trim().email().max(240),
  replyToEmail: z.string().trim().email().max(240).optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const smsConfigSchema = z.object({
  provider: z.enum(["SMTP", "API", "CUSTOM"]),
  baseUrl: z.string().trim().max(500).optional().nullable(),
  apiKey: z.string().max(2000).optional().nullable(),
  apiSecret: z.string().max(2000).optional().nullable(),
  clearApiKey: z.coerce.boolean().optional().default(false),
  clearApiSecret: z.coerce.boolean().optional().default(false),
  senderId: z.string().trim().max(40).optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const messageTemplateParamsSchema = z.object({
  key: z.enum([
    "EMAIL_VERIFICATION",
    "PASSWORD_RESET",
    "LOGIN_ALERT",
    "OTP_CODE",
    "ACCOUNT_SUSPENDED",
    "SUBSCRIPTION_ACTIVATED",
    "SUBSCRIPTION_EXPIRED",
  ]),
});

export const messageTemplateSchema = z.object({
  subject: z.string().trim().max(180).optional().nullable(),
  body: z.string().trim().min(1).max(5000),
  isActive: z.coerce.boolean().optional().default(true),
});

export const securityConfigSchema = z.object({
  requireEmailVerification: z.coerce.boolean(),
  enablePasswordReset: z.coerce.boolean(),
  enableOtpLogin: z.coerce.boolean(),
  enableSmsOtp: z.coerce.boolean(),
  passwordMinLength: z.coerce.number().int().min(6).max(128),
  passwordRequireNumber: z.coerce.boolean(),
  passwordRequireSpecialChar: z.coerce.boolean(),
  otpExpiryMinutes: z.coerce.number().int().min(1).max(60),
  maxLoginAttempts: z.coerce.number().int().min(1).max(20),
  lockoutMinutes: z.coerce.number().int().min(1).max(1440),
  sessionExpiryMinutes: z.coerce.number().int().min(5).max(43200),
});

export const testSmsSchema = z.object({
  to: z.string().trim().min(6).max(32),
  message: z.string().trim().min(1).max(480),
});
