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

const optionalEmail = z
  .preprocess((value) => {
    if (value === "") return null;
    return value;
  }, z.string().trim().email().max(240).optional().nullable())
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

export const emailConfigSchema = z
  .object({
    provider: z.enum(["SMTP", "API", "CUSTOM"]),
    host: nullableTrimmedString(240),
    port: z.coerce.number().int().min(1).max(65535).optional().nullable(),
    username: nullableTrimmedString(240),
    password: optionalSecret,
    apiKey: optionalSecret,
    fromName: z.string().trim().min(1).max(120),
    fromEmail: z.string().trim().email().max(240),
    replyToEmail: optionalEmail,
    isActive: booleanInput.optional().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.provider !== "SMTP") return;

    if (!value.host) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["host"],
        message: "SMTP host is required.",
      });
    }

    if (!value.port) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["port"],
        message: "SMTP port is required.",
      });
    }
  });

export const testEmailSchema = z.object({
  to: z.string().trim().email().max(240),
});

export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;
