import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1).max(128),
  phone: z.string().trim().min(3).max(40).optional(),
  businessName: z.string().trim().min(2).max(160),
  country: z.string().trim().min(2).max(100).default("Tanzania"),
  currency: z.string().trim().min(3).max(3).toUpperCase(),
  packageId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional(),
  ),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1).max(128),
});

export const googleAuthSchema = z.object({
  credential: z.string().trim().min(20),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20).max(256),
});

export const sendVerificationEmailSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
});

export const otpLoginSchema = z.object({
  otpToken: z.string().trim().min(20).max(256),
  otpCode: z.string().trim().regex(/^\d{6}$/, "OTP code must be 6 digits."),
});

export const requestLoginOtpSchema = loginSchema;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(256),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(1).max(128),
});
