import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getAuditContext } from "../utils/auditContext";

type PrismaExecutor = Prisma.TransactionClient | PrismaClient;

export type CreateAuditLogInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
};

function isSensitiveKey(key: string) {
  return /password|apiKey|apiSecret|secret|token|credential|authorization/i.test(key);
}

function maskSensitiveValue(value: string) {
  if (!value) return value;
  if (value.includes("*")) return value;
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(8, value.length - visible.length))}${visible}`;
}

function sanitizeAuditValue(value: unknown, key = ""): unknown {
  if (value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditValue(item) ?? null);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([childKey, childValue]) => [childKey, sanitizeAuditValue(childValue, childKey)] as const)
        .filter(([, childValue]) => childValue !== undefined),
    );
  }
  if (typeof value === "string" && isSensitiveKey(key)) return maskSensitiveValue(value);
  return value;
}

function sanitizeAuditMetadata(metadata: Record<string, unknown>) {
  return sanitizeAuditValue(metadata) as Prisma.InputJsonObject;
}

export async function createAuditLog(
  input: CreateAuditLogInput,
  client: PrismaExecutor = prisma,
) {
  const context = getAuditContext();
  const metadata = sanitizeAuditMetadata({
    ...(input.metadata ?? {}),
    ...(context.adminIpAddress ? { adminIpAddress: context.adminIpAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
  });
  const targetUserId = input.targetType === "User" ? input.targetId : null;

  return client.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata,
      targetUserId,
      details: metadata,
    },
  });
}
