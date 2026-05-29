import type { ConfigProvider, EmailConfig } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  decryptValue,
  encryptValue,
  maskEncryptedValue,
  maskValue,
} from "../utils/encryption.util";
import type { EmailConfigInput, TestEmailInput } from "../validators/emailConfig.validators";
import { createAuditLog } from "./audit.service";
import { sendTestEmail } from "./emailProvider.service";

export type SafeEmailConfig = {
  id: string;
  provider: ConfigProvider;
  host: string | null;
  port: number | null;
  username: string | null;
  passwordMasked: string | null;
  apiKeyMasked: string | null;
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function hasOwn(input: object, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function encryptSecret(value?: string | null) {
  try {
    return encryptValue(value);
  } catch {
    throw new AppError("Email encryption is not configured.", 500);
  }
}

function decryptSecret(value?: string | null) {
  if (!value) return null;
  const decrypted = decryptValue(value);

  if (!decrypted) {
    throw new AppError("Saved email credentials could not be read. Re-save the email configuration.", 500);
  }

  return decrypted;
}

function serializeEmailConfig(config: EmailConfig | null): SafeEmailConfig | null {
  if (!config) return null;

  return {
    id: config.id,
    provider: config.provider,
    host: config.host,
    port: config.port,
    username: config.username,
    passwordMasked: maskEncryptedValue(config.passwordEncrypted),
    apiKeyMasked: maskEncryptedValue(config.apiKeyEncrypted),
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyToEmail: config.replyToEmail,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function emailConfigSnapshot(config: EmailConfig | null) {
  if (!config) return null;
  return {
    provider: config.provider,
    host: config.host,
    port: config.port,
    username: config.username,
    passwordMasked: maskEncryptedValue(config.passwordEncrypted),
    apiKeyMasked: maskEncryptedValue(config.apiKeyEncrypted),
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyToEmail: config.replyToEmail,
    isActive: config.isActive,
  };
}

function safeChangedFields(input: EmailConfigInput) {
  return Object.keys(input).filter((key) => !["password", "apiKey"].includes(key));
}

export async function getEmailConfig() {
  const config = await prisma.emailConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return serializeEmailConfig(config);
}

export async function updateEmailConfig(actorId: string, input: EmailConfigInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.emailConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    const secretUpdates: {
      passwordEncrypted?: string | null;
      apiKeyEncrypted?: string | null;
    } = {};

    if (hasOwn(input, "password")) {
      secretUpdates.passwordEncrypted = input.password ? encryptSecret(input.password) : null;
    }

    if (hasOwn(input, "apiKey")) {
      secretUpdates.apiKeyEncrypted = input.apiKey ? encryptSecret(input.apiKey) : null;
    }

    const data = {
      provider: input.provider,
      host: nullableText(input.host),
      port: input.port ?? null,
      username: nullableText(input.username),
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      replyToEmail: nullableText(input.replyToEmail),
      isActive: input.isActive,
      ...secretUpdates,
    };

    const config = existing
      ? await tx.emailConfig.update({ where: { id: existing.id }, data })
      : await tx.emailConfig.create({ data });

    if (config.isActive) {
      await tx.emailConfig.updateMany({
        where: { id: { not: config.id } },
        data: { isActive: false },
      });
    }

    await createAuditLog(
      {
        actorId,
        action: "EMAIL_CONFIG_UPDATED",
        targetType: "EmailConfig",
        targetId: config.id,
        metadata: {
          targetName: config.fromEmail,
          changedFields: safeChangedFields(input),
          passwordUpdated: hasOwn(input, "password"),
          apiKeyUpdated: hasOwn(input, "apiKey"),
          provider: config.provider,
          fromEmail: config.fromEmail,
          isActive: config.isActive,
          oldValue: emailConfigSnapshot(existing),
          newValue: emailConfigSnapshot(config),
        },
      },
      tx,
    );

    return serializeEmailConfig(config);
  });
}

export async function testEmailConfig(actorId: string, input: TestEmailInput) {
  const config = await prisma.emailConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    throw new AppError("Configure an active email provider before sending a test email.", 400);
  }

  const password = config.passwordEncrypted ? decryptSecret(config.passwordEncrypted) : null;
  const apiKey = !password && config.apiKeyEncrypted
    ? decryptSecret(config.apiKeyEncrypted)
    : null;

  try {
    await sendTestEmail({
      provider: config.provider,
      host: config.host,
      port: config.port,
      username: config.username,
      password,
      apiKey,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      replyToEmail: config.replyToEmail,
      to: input.to,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Could not send test email. Check your email configuration and try again.", 502);
  }

  await createAuditLog({
    actorId,
    action: "EMAIL_TEST_SENT",
    targetType: "EmailConfig",
    targetId: config.id,
    metadata: {
      targetName: config.fromEmail,
      provider: config.provider,
      fromEmail: config.fromEmail,
      to: maskValue(input.to),
    },
  });

  return {
    status: "SENT",
    provider: config.provider,
    fromEmail: config.fromEmail,
    toMasked: maskValue(input.to),
  };
}
