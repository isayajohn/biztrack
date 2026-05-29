import { z } from "zod";

const booleanInput = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

export const securityConfigSchema = z.object({
  requireEmailVerification: booleanInput,
  enablePasswordReset: booleanInput,
  enableOtpLogin: booleanInput,
  enableSmsOtp: booleanInput,
  passwordMinLength: z.coerce.number().int().min(6).max(128),
  passwordRequireNumber: booleanInput,
  passwordRequireSpecialChar: booleanInput,
  otpExpiryMinutes: z.coerce.number().int().min(1).max(60),
  maxLoginAttempts: z.coerce.number().int().min(1).max(20),
  lockoutMinutes: z.coerce.number().int().min(1).max(1440),
  sessionExpiryMinutes: z.coerce.number().int().min(5).max(43200),
});

export type SecurityConfigInput = z.infer<typeof securityConfigSchema>;
