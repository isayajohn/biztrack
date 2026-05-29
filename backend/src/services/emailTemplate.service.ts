import type { MessageTemplate, Prisma, TemplateKey } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import type {
  EmailTemplateKey,
  EmailTemplateVariable,
  PreviewEmailTemplateInput,
  UpdateEmailTemplateInput,
} from "../validators/emailTemplate.validators";
import {
  emailTemplateKeys,
  emailTemplateVariables,
} from "../validators/emailTemplate.validators";
import { createAuditLog } from "./audit.service";

type EmailTemplateDefault = {
  subject: string;
  body: string;
};

type TemplateClient = Prisma.TransactionClient | typeof prisma;

const supportedVariableSet = new Set<string>(emailTemplateVariables);

const requiredVariablesByKey: Record<EmailTemplateKey, EmailTemplateVariable[]> = {
  EMAIL_VERIFICATION: ["userName", "verificationLink", "appName"],
  PASSWORD_RESET: ["userName", "resetLink", "appName"],
  LOGIN_ALERT: ["userName", "appName"],
  OTP_CODE: ["userName", "otpCode", "appName"],
  ACCOUNT_SUSPENDED: ["userName", "appName"],
  SUBSCRIPTION_ACTIVATED: ["userName", "businessName", "packageName", "appName"],
  SUBSCRIPTION_EXPIRED: [
    "userName",
    "businessName",
    "packageName",
    "subscriptionEndDate",
    "appName",
  ],
};

export const defaultEmailTemplates: Record<EmailTemplateKey, EmailTemplateDefault> = {
  EMAIL_VERIFICATION: {
    subject: "Verify your {{appName}} email",
    body: [
      "Hi {{userName}},",
      "",
      "Welcome to {{appName}}. Please verify your email using this link:",
      "{{verificationLink}}",
    ].join("\n"),
  },
  PASSWORD_RESET: {
    subject: "Reset your {{appName}} password",
    body: [
      "Hi {{userName}},",
      "",
      "Use this secure link to reset your {{appName}} password:",
      "{{resetLink}}",
    ].join("\n"),
  },
  LOGIN_ALERT: {
    subject: "New {{appName}} login",
    body: [
      "Hi {{userName}},",
      "",
      "We noticed a new login to your {{appName}} account. If this was not you, reset your password immediately.",
    ].join("\n"),
  },
  OTP_CODE: {
    subject: "Your {{appName}} login code",
    body: [
      "Hi {{userName}},",
      "",
      "Your {{appName}} login code is {{otpCode}}.",
      "It expires soon.",
    ].join("\n"),
  },
  ACCOUNT_SUSPENDED: {
    subject: "Your {{appName}} account is suspended",
    body: [
      "Hi {{userName}},",
      "",
      "Your {{appName}} account has been suspended. Contact support if you think this is a mistake.",
    ].join("\n"),
  },
  SUBSCRIPTION_ACTIVATED: {
    subject: "{{appName}} subscription activated",
    body: [
      "Hi {{userName}},",
      "",
      "{{businessName}} is now active on the {{packageName}} package in {{appName}}.",
    ].join("\n"),
  },
  SUBSCRIPTION_EXPIRED: {
    subject: "{{appName}} subscription expired",
    body: [
      "Hi {{userName}},",
      "",
      "The {{packageName}} subscription for {{businessName}} expired on {{subscriptionEndDate}}.",
      "Please renew the subscription to continue using {{appName}} without interruption.",
    ].join("\n"),
  },
};

const previewDefaults: Record<EmailTemplateVariable, string> = {
  userName: "Asha Mwinyi",
  businessName: "Asha Mini Mart",
  verificationLink: "https://app.biztrack.local/verify-email/example",
  resetLink: "https://app.biztrack.local/reset-password/example",
  otpCode: "123456",
  loginTime: "2026-05-08T09:30:00.000Z",
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/5.0",
  packageName: "Pro",
  subscriptionEndDate: "31 Dec 2026",
  appName: "BizTrack",
};

function asTemplateKey(key: EmailTemplateKey): TemplateKey {
  return key as TemplateKey;
}

function serializeTemplate(template: MessageTemplate) {
  return {
    key: template.key,
    subject: template.subject,
    body: template.body,
    isActive: template.isActive,
    requiredVariables: requiredVariablesByKey[template.key as EmailTemplateKey] ?? [],
    supportedVariables: emailTemplateVariables,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function templateAuditValue(template: Pick<MessageTemplate, "subject" | "body" | "isActive"> | null) {
  if (!template) return null;
  return {
    subject: template.subject,
    body: template.body,
    isActive: template.isActive,
  };
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

function validateTemplateVariables(key: EmailTemplateKey, subject: string, body: string) {
  const variables = extractVariables(subject, body);
  const unsupportedVariables = [...variables].filter((variable) => !supportedVariableSet.has(variable));
  const missingVariables = requiredVariablesByKey[key].filter((variable) => !variables.has(variable));

  if (unsupportedVariables.length > 0 || missingVariables.length > 0) {
    throw new AppError("Email template variables are invalid.", 400, {
      missingVariables,
      unsupportedVariables,
      supportedVariables: emailTemplateVariables,
      requiredVariables: requiredVariablesByKey[key],
    });
  }
}

async function findTemplate(client: TemplateClient, key: EmailTemplateKey) {
  return client.messageTemplate.findFirst({
    where: { type: "EMAIL", key: asTemplateKey(key) },
    orderBy: { updatedAt: "desc" },
  });
}

export async function ensureDefaultEmailTemplates(client: TemplateClient = prisma) {
  await Promise.all(
    emailTemplateKeys.map(async (key) => {
      const existing = await client.messageTemplate.findFirst({
        where: { type: "EMAIL", key: asTemplateKey(key) },
        select: { id: true },
      });
      if (existing) return;

      const template = defaultEmailTemplates[key];
      validateTemplateVariables(key, template.subject, template.body);

      await client.messageTemplate.create({
        data: {
          type: "EMAIL",
          key: asTemplateKey(key),
          subject: template.subject,
          body: template.body,
          isActive: true,
        },
      });
    }),
  );
}

export async function listEmailTemplates() {
  await ensureDefaultEmailTemplates();

  const templates = await prisma.messageTemplate.findMany({
    where: { type: "EMAIL", key: { in: emailTemplateKeys.map(asTemplateKey) } },
    orderBy: [{ key: "asc" }, { updatedAt: "desc" }],
  });

  const latestByKey = new Map<EmailTemplateKey, MessageTemplate>();
  for (const template of templates) {
    const key = template.key as EmailTemplateKey;
    if (!latestByKey.has(key)) {
      latestByKey.set(key, template);
    }
  }

  return emailTemplateKeys
    .map((key) => latestByKey.get(key))
    .filter((template): template is MessageTemplate => Boolean(template))
    .map(serializeTemplate);
}

export async function getEmailTemplate(key: EmailTemplateKey) {
  await ensureDefaultEmailTemplates();

  const template = await findTemplate(prisma, key);
  if (!template) throw new AppError("Email template not found.", 404);

  return serializeTemplate(template);
}

export async function updateEmailTemplate(
  actorId: string,
  key: EmailTemplateKey,
  input: UpdateEmailTemplateInput,
) {
  validateTemplateVariables(key, input.subject, input.body);

  return prisma.$transaction(async (tx) => {
    const existing = await findTemplate(tx, key);
    const data = {
      type: "EMAIL" as const,
      key: asTemplateKey(key),
      subject: input.subject,
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
        action: "EMAIL_TEMPLATE_UPDATED",
        targetType: "MessageTemplate",
        targetId: template.id,
        metadata: {
          targetName: key,
          key,
          isActive: template.isActive,
          changedFields: existing
            ? Object.entries({
                subject: existing.subject !== template.subject,
                body: existing.body !== template.body,
                isActive: existing.isActive !== template.isActive,
              })
                .filter(([, changed]) => changed)
                .map(([field]) => field)
            : ["subject", "body", "isActive"],
          variablesUsed: [...extractVariables(template.subject, template.body)].sort(),
          oldValue: templateAuditValue(existing),
          newValue: templateAuditValue(template),
        },
      },
      tx,
    );

    return serializeTemplate(template);
  });
}

function renderTemplatePart(part: string | null, variables: Record<string, string>) {
  if (!part) return null;
  return part.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (_match, variable: string) => {
    return variables[variable] ?? "";
  });
}

export async function previewEmailTemplate(key: EmailTemplateKey, input: PreviewEmailTemplateInput) {
  await ensureDefaultEmailTemplates();

  const template = await findTemplate(prisma, key);
  if (!template) throw new AppError("Email template not found.", 404);

  const variables = Object.fromEntries(
    Object.entries({
      ...previewDefaults,
      ...input.variables,
    }).map(([variable, value]) => [variable, String(value)]),
  );

  return {
    key,
    subject: renderTemplatePart(template.subject, variables),
    body: renderTemplatePart(template.body, variables),
    variables,
  };
}
