import { z } from "zod";

export const smsTemplateKeys = [
  "OTP_CODE",
  "ACCOUNT_SUSPENDED",
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_EXPIRED",
] as const;

export const smsTemplateVariables = [
  "userName",
  "businessName",
  "otpCode",
  "packageName",
  "subscriptionEndDate",
  "appName",
] as const;

export const smsTemplateParamsSchema = z.object({
  key: z.enum(smsTemplateKeys),
});

export const updateSmsTemplateSchema = z.object({
  body: z.string().trim().min(1).max(320),
  isActive: z.coerce.boolean().optional().default(true),
});

export const previewSmsTemplateSchema = z.object({
  variables: z
    .record(z.enum(smsTemplateVariables), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
});

export type SmsTemplateKey = (typeof smsTemplateKeys)[number];
export type SmsTemplateVariable = (typeof smsTemplateVariables)[number];
export type UpdateSmsTemplateInput = z.infer<typeof updateSmsTemplateSchema>;
export type PreviewSmsTemplateInput = z.infer<typeof previewSmsTemplateSchema>;
