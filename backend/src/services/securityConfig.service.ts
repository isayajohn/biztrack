import type { Prisma, PrismaClient, SecurityConfig } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import type { SecurityConfigInput } from "../validators/securityConfig.validators";
import { createAuditLog } from "./audit.service";

type PrismaExecutor = Prisma.TransactionClient | PrismaClient;
type SecurityConfigSnapshot = Pick<
  SecurityConfig,
  | "requireEmailVerification"
  | "enablePasswordReset"
  | "enableOtpLogin"
  | "enableSmsOtp"
  | "passwordMinLength"
  | "passwordRequireNumber"
  | "passwordRequireSpecialChar"
  | "otpExpiryMinutes"
  | "maxLoginAttempts"
  | "lockoutMinutes"
  | "sessionExpiryMinutes"
>;

const securityConfigKeys = [
  "requireEmailVerification",
  "enablePasswordReset",
  "enableOtpLogin",
  "enableSmsOtp",
  "passwordMinLength",
  "passwordRequireNumber",
  "passwordRequireSpecialChar",
  "otpExpiryMinutes",
  "maxLoginAttempts",
  "lockoutMinutes",
  "sessionExpiryMinutes",
] as const;

export const defaultSecurityConfig = {
  requireEmailVerification: true,
  enablePasswordReset: true,
  enableOtpLogin: false,
  enableSmsOtp: false,
  passwordMinLength: 8,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  otpExpiryMinutes: 10,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  sessionExpiryMinutes: 1440,
} satisfies SecurityConfigInput;

function snapshotSecurityConfig(config: SecurityConfig): SecurityConfigSnapshot {
  return {
    requireEmailVerification: config.requireEmailVerification,
    enablePasswordReset: config.enablePasswordReset,
    enableOtpLogin: config.enableOtpLogin,
    enableSmsOtp: config.enableSmsOtp,
    passwordMinLength: config.passwordMinLength,
    passwordRequireNumber: config.passwordRequireNumber,
    passwordRequireSpecialChar: config.passwordRequireSpecialChar,
    otpExpiryMinutes: config.otpExpiryMinutes,
    maxLoginAttempts: config.maxLoginAttempts,
    lockoutMinutes: config.lockoutMinutes,
    sessionExpiryMinutes: config.sessionExpiryMinutes,
  };
}

function getSecurityConfigChanges(
  before: SecurityConfigSnapshot | null,
  after: SecurityConfigSnapshot,
) {
  return securityConfigKeys.reduce<Record<string, { from: boolean | number | null; to: boolean | number }>>(
    (changes, key) => {
      const previousValue = before?.[key] ?? null;
      const nextValue = after[key];

      if (previousValue !== nextValue) {
        changes[key] = { from: previousValue, to: nextValue };
      }

      return changes;
    },
    {},
  );
}

export async function getActiveSecurityConfig(client: PrismaExecutor = prisma) {
  const existing = await client.securityConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (existing) return existing;
  return client.securityConfig.create({ data: defaultSecurityConfig });
}

export async function updateSecurityConfig(actorId: string, input: SecurityConfigInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.securityConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    const before = existing ? snapshotSecurityConfig(existing) : null;
    const config = existing
      ? await tx.securityConfig.update({ where: { id: existing.id }, data: input })
      : await tx.securityConfig.create({ data: input });
    const after = snapshotSecurityConfig(config);

    await createAuditLog(
      {
        actorId,
        action: "SECURITY_CONFIG_UPDATED",
        targetType: "SecurityConfig",
        targetId: config.id,
        metadata: {
          targetName: "Security Config",
          before,
          after,
          oldValue: before,
          newValue: after,
          changes: getSecurityConfigChanges(before, after),
        },
      },
      tx,
    );

    return config;
  });
}

export function validatePasswordAgainstConfig(password: string, config: SecurityConfig) {
  if (password.length < config.passwordMinLength) {
    throw new AppError(`Password must be at least ${config.passwordMinLength} characters.`, 400);
  }

  if (config.passwordRequireNumber && !/\d/.test(password)) {
    throw new AppError("Password must include at least one number.", 400);
  }

  if (config.passwordRequireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    throw new AppError("Password must include at least one special character.", 400);
  }
}

export function getSessionJwtExpiry(config: SecurityConfig) {
  return `${config.sessionExpiryMinutes}m`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
