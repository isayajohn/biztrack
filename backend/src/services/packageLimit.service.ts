import { Prisma } from "@prisma/client";
import type { BusinessSubscription, Package, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

type PrismaExecutor = Prisma.TransactionClient | PrismaClient;

export type PackageFeatureName =
  | "allowReports"
  | "allowPdfExport"
  | "allowCsvExport"
  | "allowInventoryAlerts"
  | "allowAiInsights";

export type PackageLimitName = "maxProducts" | "maxSalesPerMonth" | "maxExpensesPerMonth";

type SubscriptionWithPackage = BusinessSubscription & { package: Package };

type PackageLimitOptions = {
  client?: PrismaExecutor;
  date?: Date | string;
  incrementBy?: number;
  now?: Date;
};

type PackageFeatureOptions = {
  client?: PrismaExecutor;
  now?: Date;
};

type ActiveSubscriptionOptions = {
  client?: PrismaExecutor;
  now?: Date;
};

export const PACKAGE_LIMIT_ERROR_MESSAGE = "Package limit reached. Please upgrade your package.";

const activeSubscriptionStatuses = ["TRIAL", "ACTIVE"] as const;
export const defaultFreePackageSlug = "free";

export const defaultFreePackageData = {
  name: "Free",
  slug: defaultFreePackageSlug,
  description: "Default free package for businesses without a paid subscription.",
  priceMonthly: 0,
  priceYearly: null,
  currency: "USD",
  trialDays: 0,
  maxBusinesses: 1,
  maxUsers: 1,
  maxProducts: 20,
  maxSalesPerMonth: 100,
  maxExpensesPerMonth: 50,
  allowReports: false,
  allowPdfExport: false,
  allowCsvExport: false,
  allowInventoryAlerts: false,
  allowAiInsights: false,
  status: "ACTIVE" as const,
  sortOrder: 0,
};

export async function getOrCreateDefaultFreePackage(client: PrismaExecutor) {
  return client.package.upsert({
    where: { slug: defaultFreePackageSlug },
    update: {},
    create: defaultFreePackageData,
  });
}

function packageLimitError(details?: Record<string, unknown>) {
  return new AppError(PACKAGE_LIMIT_ERROR_MESSAGE, 403, details);
}

function isBeforeOrEqual(left: Date, right: Date) {
  return left.getTime() <= right.getTime();
}

function isSubscriptionExpired(subscription: SubscriptionWithPackage, now: Date) {
  if (subscription.endsAt && isBeforeOrEqual(subscription.endsAt, now)) return true;
  if (subscription.status === "TRIAL" && subscription.trialEndsAt) {
    return isBeforeOrEqual(subscription.trialEndsAt, now);
  }
  return false;
}

function monthRange(dateInput: Date | string | undefined, now: Date) {
  const date = dateInput instanceof Date ? dateInput : dateInput ? new Date(dateInput) : now;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

async function getOrCreateDefaultFreeSubscription(
  businessId: string,
  client: PrismaExecutor,
  now: Date,
): Promise<SubscriptionWithPackage> {
  const business = await client.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!business) throw new AppError("Business not found.", 404);

  const plan = await getOrCreateDefaultFreePackage(client);

  return client.businessSubscription.create({
    data: {
      businessId,
      packageId: plan.id,
      status: "ACTIVE",
      billingCycle: "MANUAL",
      startsAt: now,
      notes: "Default Free package assigned automatically.",
    },
    include: { package: true },
  });
}

export function createPackageLimitService(client: PrismaExecutor = prisma) {
  async function getBusinessActiveSubscription(
    businessId: string,
    options: ActiveSubscriptionOptions = {},
  ): Promise<SubscriptionWithPackage> {
    const executor = options.client ?? client;
    const now = options.now ?? new Date();

    const activeSubscription = await executor.businessSubscription.findFirst({
      where: {
        businessId,
        status: { in: [...activeSubscriptionStatuses] },
        startsAt: { lte: now },
      },
      include: { package: true },
      orderBy: [{ updatedAt: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
    });

    if (activeSubscription) {
      if (isSubscriptionExpired(activeSubscription, now)) {
        throw packageLimitError({
          reason: "SUBSCRIPTION_EXPIRED",
          subscriptionId: activeSubscription.id,
        });
      }
      return activeSubscription;
    }

    const latestSubscription = await executor.businessSubscription.findFirst({
      where: { businessId },
      include: { package: true },
      orderBy: [{ updatedAt: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
    });

    if (latestSubscription) {
      if (
        ["SUSPENDED", "CANCELLED", "EXPIRED"].includes(latestSubscription.status) ||
        isSubscriptionExpired(latestSubscription, now)
      ) {
        throw packageLimitError({
          reason: latestSubscription.status,
          subscriptionId: latestSubscription.id,
        });
      }
    }

    return getOrCreateDefaultFreeSubscription(businessId, executor, now);
  }

  async function checkPackageFeature(
    businessId: string,
    featureName: PackageFeatureName,
    options: PackageFeatureOptions = {},
  ): Promise<SubscriptionWithPackage> {
    const subscription = await getBusinessActiveSubscription(businessId, options);

    if (!subscription.package[featureName]) {
      throw packageLimitError({
        featureName,
        packageId: subscription.packageId,
        packageName: subscription.package.name,
      });
    }

    return subscription;
  }

  async function checkPackageLimit(
    businessId: string,
    limitName: PackageLimitName,
    options: PackageLimitOptions = {},
  ) {
    const executor = options.client ?? client;
    const now = options.now ?? new Date();
    const subscription = await getBusinessActiveSubscription(businessId, { client: executor, now });
    const limit = subscription.package[limitName];
    const incrementBy = options.incrementBy ?? 1;
    let used = 0;

    if (limitName === "maxProducts") {
      used = await executor.product.count({ where: { businessId } });
    } else if (limitName === "maxSalesPerMonth") {
      const { start, end } = monthRange(options.date, now);
      used = await executor.sale.count({
        where: { businessId, saleDate: { gte: start, lt: end } },
      });
    } else {
      const { start, end } = monthRange(options.date, now);
      used = await executor.expense.count({
        where: { businessId, expenseDate: { gte: start, lt: end } },
      });
    }

    if (used + incrementBy > limit) {
      throw packageLimitError({
        limitName,
        limit,
        used,
        attempted: incrementBy,
        packageId: subscription.packageId,
        packageName: subscription.package.name,
      });
    }

    return {
      subscription,
      limitName,
      limit,
      used,
      remaining: Math.max(limit - used - incrementBy, 0),
    };
  }

  return {
    getBusinessActiveSubscription,
    checkPackageFeature,
    checkPackageLimit,
  };
}

const packageLimitService = createPackageLimitService();

export const getBusinessActiveSubscription = packageLimitService.getBusinessActiveSubscription;
export const checkPackageFeature = packageLimitService.checkPackageFeature;
export const checkPackageLimit = packageLimitService.checkPackageLimit;
