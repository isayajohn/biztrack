import { z } from "zod";

export const emailTemplateKeys = [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "LOGIN_ALERT",
  "OTP_CODE",
  "ACCOUNT_SUSPENDED",
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_EXPIRED",
] as const;

export const emailTemplateVariables = [
  "userName",
  "businessName",
  "verificationLink",
  "resetLink",
  "otpCode",
  "loginTime",
  "ipAddress",
  "userAgent",
  "packageName",
  "subscriptionEndDate",
  "appName",
] as const;

export const emailTemplateParamsSchema = z.object({
  key: z.enum(emailTemplateKeys),
});

export const updateEmailTemplateSchema = z.object({
  subject: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(5000),
  isActive: z.coerce.boolean().optional().default(true),
});

export const previewEmailTemplateSchema = z.object({
  variables: z
    .record(z.enum(emailTemplateVariables), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
});

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];
export type EmailTemplateVariable = (typeof emailTemplateVariables)[number];
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export type PreviewEmailTemplateInput = z.infer<typeof previewEmailTemplateSchema>;
