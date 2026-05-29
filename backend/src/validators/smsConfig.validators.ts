import { z } from "zod";

const nullableTrimmedString = (max: number) =>
  z
    .preprocess((value) => {
      if (value === "") return null;
      return value;
    }, z.string().trim().max(max).optional().nullable())
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      return value.length > 0 ? value : null;
    });

const nullableUrl = nullableTrimmedString(500).refine((value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}, "Base URL must be a valid HTTP or HTTPS URL.");

const optionalSecret = z
  .preprocess((value) => {
    if (value === "") return null;
    return value;
  }, z.string().max(2000).optional().nullable())
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return value.length > 0 ? value : null;
  });

const booleanInput = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value;
}, z.boolean());

const phoneNumberSchema = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .refine((value) => /^[+]?[\d\s().-]+$/.test(value), "Phone number contains invalid characters.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Phone number must contain 7 to 15 digits.")
  .transform((value) => {
    const startsWithPlus = value.trim().startsWith("+");
    const digits = value.replace(/\D/g, "");
    return startsWithPlus ? `+${digits}` : digits;
  });

export const smsConfigSchema = z
  .object({
    provider: z.enum(["SMTP", "API", "CUSTOM"]),
    baseUrl: nullableUrl,
    apiKey: optionalSecret,
    apiSecret: optionalSecret,
    senderId: nullableTrimmedString(40),
    isActive: booleanInput.optional().default(true),
  })
  .superRefine((value, ctx) => {
    if (!value.isActive || value.provider === "SMTP") return;

    if (!value.baseUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseUrl"],
        message: "SMS provider base URL is required.",
      });
    }
  });

export const testSmsSchema = z.object({
  phoneNumber: phoneNumberSchema,
  message: z.string().trim().min(1).max(480),
});

export type SmsConfigInput = z.infer<typeof smsConfigSchema>;
export type TestSmsInput = z.infer<typeof testSmsSchema>;
