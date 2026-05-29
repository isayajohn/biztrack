import type { ConfigProvider, SmsConfig } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  decryptValue,
  encryptValue,
  maskEncryptedValue,
  maskValue,
} from "../utils/encryption.util";
import type { SmsConfigInput, TestSmsInput } from "../validators/smsConfig.validators";
import { createAuditLog } from "./audit.service";
import { sendSms } from "./smsProvider.service";

export type SafeSmsConfig = {
  id: string;
  provider: ConfigProvider;
  baseUrl: string | null;
  apiKeyMasked: string | null;
  apiSecretMasked: string | null;
  senderId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SmsProviderConfig = {
  id: string;
  provider: ConfigProvider;
  baseUrl: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  senderId: string | null;
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
    throw new AppError("SMS encryption is not configured.", 500);
  }
}

function decryptSecret(value?: string | null) {
  if (!value) return null;
  const decrypted = decryptValue(value);

  if (!decrypted) {
    throw new AppError("Saved SMS credentials could not be read. Re-save the SMS configuration.", 500);
  }

  return decrypted;
}

function serializeSmsConfig(config: SmsConfig | null): SafeSmsConfig | null {
  if (!config) return null;

  return {
    id: config.id,
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKeyMasked: maskEncryptedValue(config.apiKeyEncrypted),
    apiSecretMasked: maskEncryptedValue(config.apiSecretEncrypted),
    senderId: config.senderId,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function smsConfigSnapshot(config: SmsConfig | null) {
  if (!config) return null;
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKeyMasked: maskEncryptedValue(config.apiKeyEncrypted),
    apiSecretMasked: maskEncryptedValue(config.apiSecretEncrypted),
    senderId: config.senderId,
    isActive: config.isActive,
  };
}

function safeChangedFields(input: SmsConfigInput) {
  return Object.keys(input).filter((key) => !["apiKey", "apiSecret"].includes(key));
}

export async function getSmsConfig() {
  const config = await prisma.smsConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return serializeSmsConfig(config);
}

export async function updateSmsConfig(actorId: string, input: SmsConfigInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.smsConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    const secretUpdates: {
      apiKeyEncrypted?: string | null;
      apiSecretEncrypted?: string | null;
    } = {};

    if (hasOwn(input, "apiKey")) {
      secretUpdates.apiKeyEncrypted = input.apiKey ? encryptSecret(input.apiKey) : null;
    }

    if (hasOwn(input, "apiSecret")) {
      secretUpdates.apiSecretEncrypted = input.apiSecret ? encryptSecret(input.apiSecret) : null;
    }

    const data = {
      provider: input.provider,
      baseUrl: nullableText(input.baseUrl),
      senderId: nullableText(input.senderId),
      isActive: input.isActive,
      ...secretUpdates,
    };

    const config = existing
      ? await tx.smsConfig.update({ where: { id: existing.id }, data })
      : await tx.smsConfig.create({ data });

    if (config.isActive) {
      await tx.smsConfig.updateMany({
        where: { id: { not: config.id } },
        data: { isActive: false },
      });
    }

    await createAuditLog(
      {
        actorId,
        action: "SMS_CONFIG_UPDATED",
        targetType: "SmsConfig",
        targetId: config.id,
        metadata: {
          targetName: config.senderId ?? config.provider,
          changedFields: safeChangedFields(input),
          apiKeyUpdated: hasOwn(input, "apiKey"),
          apiSecretUpdated: hasOwn(input, "apiSecret"),
          provider: config.provider,
          senderId: config.senderId,
          isActive: config.isActive,
          oldValue: smsConfigSnapshot(existing),
          newValue: smsConfigSnapshot(config),
        },
      },
      tx,
    );

    return serializeSmsConfig(config);
  });
}

export async function getActiveSmsProviderConfig(): Promise<SmsProviderConfig> {
  const config = await prisma.smsConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    throw new AppError("Configure an active SMS provider before sending SMS.", 400);
  }

  return {
    id: config.id,
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKey: decryptSecret(config.apiKeyEncrypted),
    apiSecret: decryptSecret(config.apiSecretEncrypted),
    senderId: config.senderId,
  };
}

export async function testSmsConfig(actorId: string, input: TestSmsInput) {
  const config = await getActiveSmsProviderConfig();

  await sendSms({
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    senderId: config.senderId,
    phoneNumber: input.phoneNumber,
    message: input.message,
  });

  await createAuditLog({
    actorId,
    action: "SMS_TEST_SENT",
    targetType: "SmsConfig",
    targetId: config.id,
    metadata: {
      targetName: config.senderId ?? config.provider,
      provider: config.provider,
      senderId: config.senderId,
      phoneNumber: maskValue(input.phoneNumber),
      messageLength: input.message.length,
    },
  });

  return {
    status: "SENT",
    provider: config.provider,
    senderId: config.senderId,
    phoneNumberMasked: maskValue(input.phoneNumber),
  };
}
