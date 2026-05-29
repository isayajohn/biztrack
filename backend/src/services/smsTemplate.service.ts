import type { MessageTemplate, Prisma, TemplateKey } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { createAuditLog } from "./audit.service";
import type {
  PreviewSmsTemplateInput,
  SmsTemplateKey,
  SmsTemplateVariable,
  UpdateSmsTemplateInput,
} from "../validators/smsTemplate.validators";
import {
  smsTemplateKeys,
  smsTemplateVariables,
} from "../validators/smsTemplate.validators";

type SmsTemplateDefault = {
  body: string;
};

type TemplateClient = Prisma.TransactionClient | typeof prisma;
type TemplateVariables = Record<string, string | number | boolean | Date | null | undefined>;

const supportedVariableSet = new Set<string>(smsTemplateVariables);

const requiredVariablesByKey: Record<SmsTemplateKey, SmsTemplateVariable[]> = {
  OTP_CODE: ["otpCode", "appName"],
  ACCOUNT_SUSPENDED: ["userName", "appName"],
  SUBSCRIPTION_ACTIVATED: ["businessName", "packageName", "appName"],
  SUBSCRIPTION_EXPIRED: ["businessName", "packageName", "subscriptionEndDate", "appName"],
};

export const defaultSmsTemplates: Record<SmsTemplateKey, SmsTemplateDefault> = {
  OTP_CODE: {
    body: "{{appName}} code: {{otpCode}}. Expires soon.",
  },
  ACCOUNT_SUSPENDED: {
    body: "Hi {{userName}}, your {{appName}} account is suspended. Contact support.",
  },
  SUBSCRIPTION_ACTIVATED: {
    body: "{{businessName}} is active on {{packageName}} in {{appName}}.",
  },
  SUBSCRIPTION_EXPIRED: {
    body: "{{businessName}} {{packageName}} subscription expired on {{subscriptionEndDate}}. Renew in {{appName}}.",
  },
};

const previewDefaults: Record<SmsTemplateVariable, string> = {
  userName: "Asha Mwinyi",
  businessName: "Asha Mini Mart",
  otpCode: "123456",
  packageName: "Pro",
  subscriptionEndDate: "31 Dec 2026",
  appName: "BizTrack",
};

function variableValue(value: TemplateVariables[string]) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  return String(value);
}

function asTemplateKey(key: SmsTemplateKey): TemplateKey {
  return key as TemplateKey;
}

function extractVariables(...parts: Array<string | null | undefined>) {
  const found = new Set<string>();
  const pattern = /{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g;

  for (const part of parts) {
    if (!part) continue;
    for (const match of part.matchAll(pattern)) {
      found.add(match[1]);
    }
  }

  return found;
}

function validateTemplateVariables(key: SmsTemplateKey, body: string) {
  const variables = extractVariables(body);
  const unsupportedVariables = [...variables].filter((variable) => !supportedVariableSet.has(variable));
  const missingVariables = requiredVariablesByKey[key].filter((variable) => !variables.has(variable));

  if (unsupportedVariables.length > 0 || missingVariables.length > 0) {
    throw new AppError("SMS template variables are invalid.", 400, {
      missingVariables,
      unsupportedVariables,
      supportedVariables: smsTemplateVariables,
      requiredVariables: requiredVariablesByKey[key],
    });
  }
}

function hasTemplateVariableIssues(key: SmsTemplateKey, body: string) {
  const variables = extractVariables(body);
  return (
    body.length > 320 ||
    [...variables].some((variable) => !supportedVariableSet.has(variable)) ||
    requiredVariablesByKey[key].some((variable) => !variables.has(variable))
  );
}

function serializeTemplate(template: MessageTemplate) {
  return {
    key: template.key,
    body: template.body,
    isActive: template.isActive,
    requiredVariables: requiredVariablesByKey[template.key as SmsTemplateKey] ?? [],
    supportedVariables: smsTemplateVariables,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function templateAuditValue(template: Pick<MessageTemplate, "body" | "isActive"> | null) {
  if (!template) return null;
  return {
    body: template.body,
    isActive: template.isActive,
  };
}

async function findTemplate(client: TemplateClient, key: SmsTemplateKey) {
  return client.messageTemplate.findFirst({
    where: { type: "SMS", key: asTemplateKey(key) },
    orderBy: { updatedAt: "desc" },
  });
}

export async function ensureDefaultSmsTemplates(client: TemplateClient = prisma) {
  await Promise.all(
    smsTemplateKeys.map(async (key) => {
      const existing = await client.messageTemplate.findFirst({
        where: { type: "SMS", key: asTemplateKey(key) },
        select: { id: true, body: true },
      });

      const template = defaultSmsTemplates[key];
      validateTemplateVariables(key, template.body);

      if (existing) {
        if (hasTemplateVariableIssues(key, existing.body)) {
          await client.messageTemplate.update({
            where: { id: existing.id },
            data: {
              subject: null,
              body: template.body,
              isActive: true,
            },
          });
        }
        return;
      }

      await client.messageTemplate.create({
        data: {
          type: "SMS",
          key: asTemplateKey(key),
          subject: null,
          body: template.body,
          isActive: true,
        },
      });
    }),
  );
}

export async function listSmsTemplates() {
  await ensureDefaultSmsTemplates();

  const templates = await prisma.messageTemplate.findMany({
    where: { type: "SMS", key: { in: smsTemplateKeys.map(asTemplateKey) } },
    orderBy: [{ key: "asc" }, { updatedAt: "desc" }],
  });

  const latestByKey = new Map<SmsTemplateKey, MessageTemplate>();
  for (const template of templates) {
    const key = template.key as SmsTemplateKey;
    if (!latestByKey.has(key)) {
      latestByKey.set(key, template);
    }
  }

  return smsTemplateKeys
    .map((key) => latestByKey.get(key))
    .filter((template): template is MessageTemplate => Boolean(template))
    .map(serializeTemplate);
}

export async function getSmsTemplate(key: SmsTemplateKey) {
  await ensureDefaultSmsTemplates();

  const template = await findTemplate(prisma, key);
  if (!template) throw new AppError("SMS template not found.", 404);

  return serializeTemplate(template);
}

export async function updateSmsTemplate(
  actorId: string,
  key: SmsTemplateKey,
  input: UpdateSmsTemplateInput,
) {
  validateTemplateVariables(key, input.body);

  return prisma.$transaction(async (tx) => {
    const existing = await findTemplate(tx, key);
    const data = {
      type: "SMS" as const,
      key: asTemplateKey(key),
      subject: null,
      body: input.body,
      isActive: input.isActive,
    };

    const template = existing
      ? await tx.messageTemplate.update({
          where: { id: existing.id },
          data: {
            subject: data.subject,
            body: data.body,
            isActive: data.isActive,
          },
        })
      : await tx.messageTemplate.create({ data });

    await createAuditLog(
      {
        actorId,
        action: "SMS_TEMPLATE_UPDATED",
        targetType: "MessageTemplate",
        targetId: template.id,
        metadata: {
          targetName: key,
          key,
          isActive: template.isActive,
          changedFields: existing
            ? Object.entries({
                body: existing.body !== template.body,
                isActive: existing.isActive !== template.isActive,
              })
                .filter(([, changed]) => changed)
                .map(([field]) => field)
            : ["body", "isActive"],
          variablesUsed: [...extractVariables(template.body)].sort(),
          oldValue: templateAuditValue(existing),
          newValue: templateAuditValue(template),
        },
      },
      tx,
    );

    return serializeTemplate(template);
  });
}

function renderTemplatePart(part: string, variables: Record<string, string>) {
  return part.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (_match, variable: string) => {
    return variables[variable] ?? "";
  });
}

export async function renderActiveSmsTemplate(key: SmsTemplateKey, variables: TemplateVariables) {
  await ensureDefaultSmsTemplates();

  const template = await prisma.messageTemplate.findFirst({
    where: {
      type: "SMS",
      key: asTemplateKey(key),
      isActive: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!template) {
    throw new AppError("Required SMS template is missing or inactive.", 400, { key });
  }

  const mergedVariables: TemplateVariables = {
    appName: "BizTrack",
    ...variables,
  };
  const body = template.body.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (_match, variable: string) => {
    return variableValue(mergedVariables[variable]);
  });

  return { body };
}

export async function previewSmsTemplate(key: SmsTemplateKey, input: PreviewSmsTemplateInput) {
  await ensureDefaultSmsTemplates();

  const template = await findTemplate(prisma, key);
  if (!template) throw new AppError("SMS template not found.", 404);

  const variables = Object.fromEntries(
    Object.entries({
      ...previewDefaults,
      ...input.variables,
    }).map(([variable, value]) => [variable, String(value)]),
  );
  const body = renderTemplatePart(template.body, variables);

  return {
    key,
    body,
    characterCount: body.length,
    variables,
  };
}
