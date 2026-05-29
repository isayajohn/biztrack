import { Prisma } from "@prisma/client";
import type {
  BillingCycle,
  ConfigProvider,
  EmailConfig,
  LandingPageContent,
  MessageTemplate,
  PackageStatus,
  SmsConfig,
  SubscriptionStatus,
  TemplateKey,
  TemplateType,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { money } from "../utils/mappers";
import { encryptSecret, maskEncryptedSecret, maskSecret } from "../utils/secretCrypto";
import { createAuditLog } from "./audit.service";
import {
  getActiveSecurityConfig,
  updateSecurityConfig as updateAccountSecurityConfig,
} from "./securityConfig.service";
import type { PaginatedResult, PaginationMeta } from "../types/admin";

type PackagePayload = {
  name: string;
  slug?: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly?: number | null;
  currency: string;
  trialDays?: number;
  maxBusinesses: number;
  maxUsers: number;
  maxProducts: number;
  maxSalesPerMonth: number;
  maxExpensesPerMonth: number;
  allowReports: boolean;
  allowPdfExport: boolean;
  allowCsvExport: boolean;
  allowInventoryAlerts: boolean;
  allowAiInsights: boolean;
  status?: PackageStatus;
  sortOrder?: number;
};

type SubscriptionPayload = {
  businessId: string;
  packageId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startsAt?: Date;
  endsAt?: Date | null;
  trialEndsAt?: Date | null;
  notes?: string | null;
};

type LandingPayload = {
  heroTitle: string;
  heroSubtitle: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  features: Prisma.InputJsonValue;
  pricing: Prisma.InputJsonValue;
  faqs: Prisma.InputJsonValue;
  testimonials?: Prisma.InputJsonValue | null;
  footerLinks?: Prisma.InputJsonValue | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isPublished: boolean;
};

type EmailConfigPayload = {
  provider: ConfigProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  apiKey?: string | null;
  clearPassword?: boolean;
  clearApiKey?: boolean;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  isActive: boolean;
};

type SmsConfigPayload = {
  provider: ConfigProvider;
  baseUrl?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  clearApiKey?: boolean;
  clearApiSecret?: boolean;
  senderId?: string | null;
  isActive: boolean;
};

type TemplatePayload = {
  subject?: string | null;
  body: string;
  isActive: boolean;
};

type SecurityPayload = {
  requireEmailVerification: boolean;
  enablePasswordReset: boolean;
  enableOtpLogin: boolean;
  enableSmsOtp: boolean;
  passwordMinLength: number;
  passwordRequireNumber: boolean;
  passwordRequireSpecialChar: boolean;
  otpExpiryMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  sessionExpiryMinutes: number;
};

type SubscriptionQuery = {
  businessId?: string;
  status?: SubscriptionStatus;
  page: number;
  limit: number;
};

const activeSubscriptionStatuses: SubscriptionStatus[] = ["TRIAL", "ACTIVE"];

export const defaultLandingContent = {
  heroTitle: "Know your sales, expenses, and profit every day.",
  heroSubtitle:
    "BizTrack gives small businesses a simple way to record money in, money out, stock changes, and profit without complicated accounting tools.",
  primaryButtonText: "Get Started Free",
  primaryButtonUrl: "/register",
  secondaryButtonText: "View Demo",
  secondaryButtonUrl: "/demo",
  features: [
    { title: "Track daily sales", text: "Record every sale in seconds and see what is moving today." },
    { title: "Control expenses", text: "Keep rent, stock, transport, and service costs in one simple list." },
    { title: "Know your stock", text: "Watch products and inventory before missed sales become a habit." },
    { title: "Read clear reports", text: "Understand profit, cash flow, and product performance without spreadsheets." },
  ],
  pricing: [
    { name: "Free", price: "0", description: "Start tracking one small business." },
    { name: "Pro", price: "19", description: "More records, reports, and inventory alerts." },
    { name: "Business", price: "49", description: "Expanded limits for growing teams." },
  ],
  faqs: [
    { question: "Can I use BizTrack on my phone?", answer: "Yes, the app is designed for daily mobile and desktop use." },
    { question: "Can I export my records?", answer: "Paid packages can enable export options from the admin plan setup." },
  ],
  testimonials: [],
  footerLinks: [],
  seoTitle: "BizTrack",
  seoDescription: "Sales, expenses, stock, and profit tracking for small businesses.",
  isPublished: true,
};

const defaultTemplates: Record<TemplateType, Array<{ key: TemplateKey; subject?: string; body: string }>> = {
  EMAIL: [
    {
      key: "EMAIL_VERIFICATION",
      subject: "Verify your {{appName}} email",
      body: [
        "Hi {{userName}},",
        "",
        "Welcome to {{appName}}. Please verify your email using this link:",
        "{{verificationLink}}",
      ].join("\n"),
    },
    {
      key: "PASSWORD_RESET",
      subject: "Reset your {{appName}} password",
      body: [
        "Hi {{userName}},",
        "",
        "Use this secure link to reset your {{appName}} password:",
        "{{resetLink}}",
      ].join("\n"),
    },
    {
      key: "LOGIN_ALERT",
      subject: "New {{appName}} login",
      body: [
        "Hi {{userName}},",
        "",
        "We noticed a new login to your {{appName}} account. If this was not you, reset your password immediately.",
      ].join("\n"),
    },
    {
      key: "OTP_CODE",
      subject: "Your {{appName}} login code",
      body: [
        "Hi {{userName}},",
        "",
        "Your {{appName}} login code is {{otpCode}}.",
        "It expires soon.",
      ].join("\n"),
    },
    {
      key: "ACCOUNT_SUSPENDED",
      subject: "Your {{appName}} account is suspended",
      body: [
        "Hi {{userName}},",
        "",
        "Your {{appName}} account has been suspended. Contact support if you think this is a mistake.",
      ].join("\n"),
    },
    {
      key: "SUBSCRIPTION_ACTIVATED",
      subject: "{{appName}} subscription activated",
      body: [
        "Hi {{userName}},",
        "",
        "{{businessName}} is now active on the {{packageName}} package in {{appName}}.",
      ].join("\n"),
    },
    {
      key: "SUBSCRIPTION_EXPIRED",
      subject: "{{appName}} subscription expired",
      body: [
        "Hi {{userName}},",
        "",
        "The {{packageName}} subscription for {{businessName}} expired on {{subscriptionEndDate}}.",
        "Please renew the subscription to continue using {{appName}} without interruption.",
      ].join("\n"),
    },
  ],
  SMS: [
    {
      key: "OTP_CODE",
      body: "{{appName}} code: {{otpCode}}. Expires soon.",
    },
    {
      key: "ACCOUNT_SUSPENDED",
      body: "Hi {{userName}}, your {{appName}} account is suspended. Contact support.",
    },
    {
      key: "SUBSCRIPTION_ACTIVATED",
      body: "{{businessName}} is active on {{packageName}} in {{appName}}.",
    },
    {
      key: "SUBSCRIPTION_EXPIRED",
      body: "{{businessName}} {{packageName}} subscription expired on {{subscriptionEndDate}}. Renew in {{appName}}.",
    },
  ],
};

function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serializePackage(
  plan: Prisma.PackageGetPayload<{ include: { _count: { select: { subscriptions: true } } } }>,
) {
  return {
    ...plan,
    priceMonthly: money(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? null : money(plan.priceYearly),
    subscriptionCount: plan._count.subscriptions,
  };
}

function serializeSubscription(
  subscription: Prisma.BusinessSubscriptionGetPayload<{
    include: {
      business: { select: { id: true; name: true; currency: true; country: true; user: { select: { id: true; name: true; email: true } } } };
      package: true;
    };
  }>,
) {
  return {
    ...subscription,
    package: {
      ...subscription.package,
      priceMonthly: money(subscription.package.priceMonthly),
      priceYearly: subscription.package.priceYearly == null ? null : money(subscription.package.priceYearly),
    },
  };
}

function serializeEmailConfig(config: EmailConfig | null) {
  if (!config) return null;

  return {
    id: config.id,
    provider: config.provider,
    host: config.host,
    port: config.port,
    username: config.username,
    passwordMasked: maskEncryptedSecret(config.passwordEncrypted),
    apiKeyMasked: maskEncryptedSecret(config.apiKeyEncrypted),
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyToEmail: config.replyToEmail,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function serializeSmsConfig(config: SmsConfig | null) {
  if (!config) return null;

  return {
    id: config.id,
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKeyMasked: maskEncryptedSecret(config.apiKeyEncrypted),
    apiSecretMasked: maskEncryptedSecret(config.apiSecretEncrypted),
    senderId: config.senderId,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function jsonItemCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function landingAuditValue(content: LandingPageContent | null) {
  if (!content) return null;
  return {
    heroTitle: content.heroTitle,
    primaryButtonText: content.primaryButtonText,
    primaryButtonUrl: content.primaryButtonUrl,
    secondaryButtonText: content.secondaryButtonText,
    secondaryButtonUrl: content.secondaryButtonUrl,
    featureCount: jsonItemCount(content.features),
    pricingCount: jsonItemCount(content.pricing),
    faqCount: jsonItemCount(content.faqs),
    testimonialCount: jsonItemCount(content.testimonials),
    footerLinkCount: jsonItemCount(content.footerLinks),
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    isPublished: content.isPublished,
  };
}

function emailConfigAuditValue(config: EmailConfig | null) {
  if (!config) return null;
  return {
    provider: config.provider,
    host: config.host,
    port: config.port,
    username: config.username,
    passwordMasked: maskEncryptedSecret(config.passwordEncrypted),
    apiKeyMasked: maskEncryptedSecret(config.apiKeyEncrypted),
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyToEmail: config.replyToEmail,
    isActive: config.isActive,
  };
}

function smsConfigAuditValue(config: SmsConfig | null) {
  if (!config) return null;
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKeyMasked: maskEncryptedSecret(config.apiKeyEncrypted),
    apiSecretMasked: maskEncryptedSecret(config.apiSecretEncrypted),
    senderId: config.senderId,
    isActive: config.isActive,
  };
}

function templateAuditValue(template: MessageTemplate | null) {
  if (!template) return null;
  return {
    subject: template.subject,
    body: template.body,
    isActive: template.isActive,
  };
}

function safeKeys(input: Record<string, unknown>) {
  return Object.keys(input).filter(
    (key) => !["password", "apiKey", "apiSecret"].includes(key),
  );
}

export async function listPackages() {
  const packages = await prisma.package.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return packages.map(serializePackage);
}

export async function createPackage(actorId: string, input: PackagePayload) {
  const slug = input.slug ? normalizeSlug(input.slug) : normalizeSlug(input.name);
  if (!slug) throw new AppError("Package slug is required.", 400);

  return prisma.$transaction(async (tx) => {
    const plan = await tx.package.create({
      data: {
        name: input.name,
        slug,
        description: nullableText(input.description),
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly ?? null,
        currency: input.currency,
        trialDays: input.trialDays ?? 0,
        maxBusinesses: input.maxBusinesses,
        maxUsers: input.maxUsers,
        maxProducts: input.maxProducts,
        maxSalesPerMonth: input.maxSalesPerMonth,
        maxExpensesPerMonth: input.maxExpensesPerMonth,
        allowReports: input.allowReports,
        allowPdfExport: input.allowPdfExport,
        allowCsvExport: input.allowCsvExport,
        allowInventoryAlerts: input.allowInventoryAlerts,
        allowAiInsights: input.allowAiInsights,
        status: input.status ?? "ACTIVE",
        sortOrder: input.sortOrder ?? 0,
      },
      include: { _count: { select: { subscriptions: true } } },
    });

    await createAuditLog(
      {
        actorId,
        action: "PACKAGE_CREATED",
        targetType: "Package",
        targetId: plan.id,
        metadata: { name: plan.name, slug: plan.slug, status: plan.status },
      },
      tx,
    );

    return serializePackage(plan);
  });
}

export async function updatePackage(actorId: string, id: string, input: Partial<PackagePayload>) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.package.findUnique({ where: { id } });
    if (!existing) throw new AppError("Package not found.", 404);

    const data: Prisma.PackageUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = normalizeSlug(input.slug);
    if (input.description !== undefined) data.description = nullableText(input.description);
    if (input.priceMonthly !== undefined) data.priceMonthly = input.priceMonthly;
    if (input.priceYearly !== undefined) data.priceYearly = input.priceYearly;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.trialDays !== undefined) data.trialDays = input.trialDays;
    if (input.maxBusinesses !== undefined) data.maxBusinesses = input.maxBusinesses;
    if (input.maxUsers !== undefined) data.maxUsers = input.maxUsers;
    if (input.maxProducts !== undefined) data.maxProducts = input.maxProducts;
    if (input.maxSalesPerMonth !== undefined) data.maxSalesPerMonth = input.maxSalesPerMonth;
    if (input.maxExpensesPerMonth !== undefined) data.maxExpensesPerMonth = input.maxExpensesPerMonth;
    if (input.allowReports !== undefined) data.allowReports = input.allowReports;
    if (input.allowPdfExport !== undefined) data.allowPdfExport = input.allowPdfExport;
    if (input.allowCsvExport !== undefined) data.allowCsvExport = input.allowCsvExport;
    if (input.allowInventoryAlerts !== undefined) data.allowInventoryAlerts = input.allowInventoryAlerts;
    if (input.allowAiInsights !== undefined) data.allowAiInsights = input.allowAiInsights;
    if (input.status !== undefined) data.status = input.status;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    const plan = await tx.package.update({
      where: { id },
      data,
      include: { _count: { select: { subscriptions: true } } },
    });

    await createAuditLog(
      {
        actorId,
        action: "PACKAGE_UPDATED",
        targetType: "Package",
        targetId: id,
        metadata: { changedFields: Object.keys(input), slug: plan.slug },
      },
      tx,
    );

    return serializePackage(plan);
  });
}

export async function listSubscriptions(
  query: SubscriptionQuery,
): Promise<PaginatedResult<ReturnType<typeof serializeSubscription>>> {
  const where: Prisma.BusinessSubscriptionWhereInput = {};
  if (query.businessId) where.businessId = query.businessId;
  if (query.status) where.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [subscriptions, total] = await Promise.all([
    prisma.businessSubscription.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true,
            country: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        package: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: query.limit,
    }),
    prisma.businessSubscription.count({ where }),
  ]);

  return {
    items: subscriptions.map(serializeSubscription),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function assignSubscription(actorId: string, input: SubscriptionPayload) {
  return prisma.$transaction(async (tx) => {
    const [business, plan] = await Promise.all([
      tx.business.findUnique({
        where: { id: input.businessId },
        select: { id: true, name: true },
      }),
      tx.package.findUnique({
        where: { id: input.packageId },
        select: { id: true, name: true, status: true },
      }),
    ]);

    if (!business) throw new AppError("Business not found.", 404);
    if (!plan) throw new AppError("Package not found.", 404);
    if (plan.status !== "ACTIVE") throw new AppError("Only active packages can be assigned.", 400);

    if (activeSubscriptionStatuses.includes(input.status)) {
      await tx.businessSubscription.updateMany({
        where: { businessId: input.businessId, status: { in: activeSubscriptionStatuses } },
        data: { status: "CANCELLED" },
      });
    }

    const subscription = await tx.businessSubscription.create({
      data: {
        businessId: input.businessId,
        packageId: input.packageId,
        status: input.status,
        billingCycle: input.billingCycle,
        startsAt: input.startsAt ?? new Date(),
        endsAt: input.endsAt ?? null,
        trialEndsAt: input.trialEndsAt ?? null,
        notes: nullableText(input.notes),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true,
            country: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        package: true,
      },
    });

    await createAuditLog(
      {
        actorId,
        action: "SUBSCRIPTION_ASSIGNED",
        targetType: "BusinessSubscription",
        targetId: subscription.id,
        metadata: {
          businessId: business.id,
          businessName: business.name,
          packageId: plan.id,
          packageName: plan.name,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
        },
      },
      tx,
    );

    return serializeSubscription(subscription);
  });
}

export async function updateSubscriptionStatus(
  actorId: string,
  id: string,
  status: SubscriptionStatus,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.businessSubscription.findUnique({
      where: { id },
      select: { id: true, businessId: true, status: true },
    });

    if (!existing) throw new AppError("Subscription not found.", 404);

    if (activeSubscriptionStatuses.includes(status)) {
      await tx.businessSubscription.updateMany({
        where: {
          businessId: existing.businessId,
          id: { not: id },
          status: { in: activeSubscriptionStatuses },
        },
        data: { status: "CANCELLED" },
      });
    }

    const subscription = await tx.businessSubscription.update({
      where: { id },
      data: { status },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true,
            country: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        package: true,
      },
    });

    if (existing.status !== status) {
      await createAuditLog(
        {
          actorId,
          action: "SUBSCRIPTION_STATUS_CHANGED",
          targetType: "BusinessSubscription",
          targetId: id,
          metadata: { from: existing.status, to: status, businessId: existing.businessId },
        },
        tx,
      );
    }

    return serializeSubscription(subscription);
  });
}

export async function extendSubscription(
  actorId: string,
  id: string,
  input: { endsAt: Date; notes?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.businessSubscription.findUnique({
      where: { id },
      select: { endsAt: true, notes: true },
    });

    if (!existing) throw new AppError("Subscription not found.", 404);

    const subscription = await tx.businessSubscription.update({
      where: { id },
      data: {
        endsAt: input.endsAt,
        notes: input.notes === undefined ? existing.notes : nullableText(input.notes),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true,
            country: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        package: true,
      },
    });

    await createAuditLog(
      {
        actorId,
        action: "SUBSCRIPTION_EXTENDED",
        targetType: "BusinessSubscription",
        targetId: id,
        metadata: {
          from: existing.endsAt?.toISOString() ?? null,
          to: input.endsAt.toISOString(),
        },
      },
      tx,
    );

    return serializeSubscription(subscription);
  });
}

export async function getLandingPageContent({ publishedOnly = false } = {}) {
  const content = await prisma.landingPageContent.findFirst({
    where: publishedOnly ? { isPublished: true } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return content ?? { id: null, createdAt: null, updatedAt: null, ...defaultLandingContent };
}

export async function updateLandingPageContent(actorId: string, input: LandingPayload) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.landingPageContent.findFirst({ orderBy: { updatedAt: "desc" } });
    const data = {
      heroTitle: input.heroTitle,
      heroSubtitle: input.heroSubtitle,
      primaryButtonText: input.primaryButtonText,
      primaryButtonUrl: input.primaryButtonUrl,
      secondaryButtonText: input.secondaryButtonText,
      secondaryButtonUrl: input.secondaryButtonUrl,
      features: input.features,
      pricing: input.pricing,
      faqs: input.faqs,
      testimonials: input.testimonials ?? [],
      footerLinks: input.footerLinks ?? [],
      seoTitle: nullableText(input.seoTitle),
      seoDescription: nullableText(input.seoDescription),
      isPublished: input.isPublished,
    };

    const content = existing
      ? await tx.landingPageContent.update({ where: { id: existing.id }, data })
      : await tx.landingPageContent.create({ data });

    await createAuditLog(
      {
        actorId,
        action: "LANDING_PAGE_UPDATED",
        targetType: "LandingPageContent",
        targetId: content.id,
        metadata: {
          targetName: content.heroTitle,
          isPublished: content.isPublished,
          heroTitle: content.heroTitle,
          oldValue: landingAuditValue(existing),
          newValue: landingAuditValue(content),
        },
      },
      tx,
    );

    return content;
  });
}

export async function publishLandingPageContent(actorId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.landingPageContent.findFirst({ orderBy: { updatedAt: "desc" } });

    const content = existing
      ? await tx.landingPageContent.update({
          where: { id: existing.id },
          data: { isPublished: true },
        })
      : await tx.landingPageContent.create({ data: defaultLandingContent });

    await createAuditLog(
      {
        actorId,
        action: "LANDING_PAGE_PUBLISHED",
        targetType: "LandingPageContent",
        targetId: content.id,
        metadata: {
          targetName: content.heroTitle,
          heroTitle: content.heroTitle,
          seoTitle: content.seoTitle,
          isPublished: content.isPublished,
          oldValue: existing ? { isPublished: existing.isPublished } : null,
          newValue: { isPublished: content.isPublished },
        },
      },
      tx,
    );

    return content;
  });
}

async function ensureTemplates(type: TemplateType) {
  await Promise.all(
    defaultTemplates[type].map(async (template) => {
      const existing = await prisma.messageTemplate.findFirst({
        where: { type, key: template.key },
        select: { id: true },
      });
      if (existing) return;
      await prisma.messageTemplate.create({
        data: {
          type,
          key: template.key,
          subject: template.subject ?? null,
          body: template.body,
        },
      });
    }),
  );
}

export async function listTemplates(type: TemplateType) {
  await ensureTemplates(type);
  return prisma.messageTemplate.findMany({
    where: { type },
    orderBy: [{ key: "asc" }],
  });
}

export async function updateTemplate(
  actorId: string,
  type: TemplateType,
  key: TemplateKey,
  input: TemplatePayload,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.messageTemplate.findFirst({ where: { type, key } });
    const template = existing
      ? await tx.messageTemplate.update({
          where: { id: existing.id },
          data: {
            subject: nullableText(input.subject),
            body: input.body,
            isActive: input.isActive,
          },
        })
      : await tx.messageTemplate.create({
          data: {
            type,
            key,
            subject: nullableText(input.subject),
            body: input.body,
            isActive: input.isActive,
          },
        });

    await createAuditLog(
      {
        actorId,
        action: `${type}_TEMPLATE_UPDATED`,
        targetType: "MessageTemplate",
        targetId: template.id,
        metadata: {
          targetName: key,
          type,
          key,
          isActive: template.isActive,
          oldValue: templateAuditValue(existing),
          newValue: templateAuditValue(template),
        },
      },
      tx,
    );

    return template;
  });
}

export async function getEmailSettings() {
  const [config, templates] = await Promise.all([
    prisma.emailConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
    listTemplates("EMAIL"),
  ]);

  return {
    config: serializeEmailConfig(config),
    templates,
  };
}

export async function updateEmailConfig(actorId: string, input: EmailConfigPayload) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.emailConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    const secretUpdates: {
      passwordEncrypted?: string | null;
      apiKeyEncrypted?: string | null;
    } = {};

    if (input.clearPassword) secretUpdates.passwordEncrypted = null;
    else if (nullableText(input.password)) secretUpdates.passwordEncrypted = encryptSecret(input.password);

    if (input.clearApiKey) secretUpdates.apiKeyEncrypted = null;
    else if (nullableText(input.apiKey)) secretUpdates.apiKeyEncrypted = encryptSecret(input.apiKey);

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
          fields: safeKeys(input as unknown as Record<string, unknown>),
          passwordUpdated: Boolean(input.clearPassword || nullableText(input.password)),
          apiKeyUpdated: Boolean(input.clearApiKey || nullableText(input.apiKey)),
          provider: config.provider,
          fromEmail: config.fromEmail,
          oldValue: emailConfigAuditValue(existing),
          newValue: emailConfigAuditValue(config),
        },
      },
      tx,
    );

    return serializeEmailConfig(config);
  });
}

export async function getSmsSettings() {
  const [config, templates] = await Promise.all([
    prisma.smsConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
    listTemplates("SMS"),
  ]);

  return {
    config: serializeSmsConfig(config),
    templates,
  };
}

export async function updateSmsConfig(actorId: string, input: SmsConfigPayload) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.smsConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    const secretUpdates: {
      apiKeyEncrypted?: string | null;
      apiSecretEncrypted?: string | null;
    } = {};

    if (input.clearApiKey) secretUpdates.apiKeyEncrypted = null;
    else if (nullableText(input.apiKey)) secretUpdates.apiKeyEncrypted = encryptSecret(input.apiKey);

    if (input.clearApiSecret) secretUpdates.apiSecretEncrypted = null;
    else if (nullableText(input.apiSecret)) secretUpdates.apiSecretEncrypted = encryptSecret(input.apiSecret);

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
          fields: safeKeys(input as unknown as Record<string, unknown>),
          apiKeyUpdated: Boolean(input.clearApiKey || nullableText(input.apiKey)),
          apiSecretUpdated: Boolean(input.clearApiSecret || nullableText(input.apiSecret)),
          provider: config.provider,
          senderId: config.senderId,
          oldValue: smsConfigAuditValue(existing),
          newValue: smsConfigAuditValue(config),
        },
      },
      tx,
    );

    return serializeSmsConfig(config);
  });
}

export async function getSecurityConfig() {
  return getActiveSecurityConfig();
}

export async function updateSecurityConfig(actorId: string, input: SecurityPayload) {
  return updateAccountSecurityConfig(actorId, input);
}

export async function testSms(actorId: string, input: { to: string; message: string }) {
  const config = await prisma.smsConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!config) throw new AppError("Configure an active SMS provider before sending a test.", 400);

  const result = {
    status: "SIMULATED",
    targetName: config.senderId ?? config.provider,
    toMasked: maskSecret(input.to),
    provider: config.provider,
    senderId: config.senderId,
    messageLength: input.message.length,
  };

  await createAuditLog({
    actorId,
    action: "SMS_TEST_SENT",
    targetType: "SmsConfig",
    targetId: config.id,
    metadata: result,
  });

  return result;
}
