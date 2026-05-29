import { Prisma } from "@prisma/client";
import type { BillingCycle, Package as PrismaPackage, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createAuditLog } from "./audit.service";
import type { PaginatedResult, PaginationMeta } from "../types/admin";
import { AppError } from "../utils/AppError";
import { money } from "../utils/mappers";
import type {
  AdminSubscriptionsQuery,
  AssignSubscriptionInput,
  ChangeBusinessPackageInput,
} from "../validators/adminSubscription.validators";

const activeSubscriptionStatuses: SubscriptionStatus[] = ["TRIAL", "ACTIVE"];

const subscriptionInclude = {
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
} satisfies Prisma.BusinessSubscriptionInclude;

type SubscriptionWithDetails = Prisma.BusinessSubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;

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

function serializePackageLimits(plan: PrismaPackage) {
  return {
    maxBusinesses: plan.maxBusinesses,
    maxUsers: plan.maxUsers,
    maxProducts: plan.maxProducts,
    maxSalesPerMonth: plan.maxSalesPerMonth,
    maxExpensesPerMonth: plan.maxExpensesPerMonth,
    allowReports: plan.allowReports,
    allowPdfExport: plan.allowPdfExport,
    allowCsvExport: plan.allowCsvExport,
    allowInventoryAlerts: plan.allowInventoryAlerts,
    allowAiInsights: plan.allowAiInsights,
  };
}

function serializePackage(plan: PrismaPackage) {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceMonthly: money(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? null : money(plan.priceYearly),
    currency: plan.currency,
    trialDays: plan.trialDays,
    status: plan.status,
    sortOrder: plan.sortOrder,
    limits: serializePackageLimits(plan),
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function serializeSubscription(subscription: SubscriptionWithDetails) {
  return {
    id: subscription.id,
    businessId: subscription.businessId,
    packageId: subscription.packageId,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    startsAt: subscription.startsAt,
    endsAt: subscription.endsAt,
    trialEndsAt: subscription.trialEndsAt,
    notes: subscription.notes,
    business: subscription.business,
    package: serializePackage(subscription.package),
    packageLimits: serializePackageLimits(subscription.package),
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

function statusAuditAction(status: SubscriptionStatus) {
  const actions: Partial<Record<SubscriptionStatus, string>> = {
    ACTIVE: "SUBSCRIPTION_ACTIVATED",
    SUSPENDED: "SUBSCRIPTION_SUSPENDED",
    CANCELLED: "SUBSCRIPTION_CANCELLED",
    EXPIRED: "SUBSCRIPTION_EXPIRED",
    TRIAL: "SUBSCRIPTION_TRIAL_STARTED",
  };

  return actions[status] ?? "SUBSCRIPTION_STATUS_CHANGED";
}

function subscriptionTargetName(businessName: string, packageName: string) {
  return `${businessName} - ${packageName}`;
}

function subscriptionAuditValue(subscription: {
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startsAt: Date;
  endsAt: Date | null;
  trialEndsAt: Date | null;
  notes: string | null;
  businessId: string;
  packageId: string;
}) {
  return {
    businessId: subscription.businessId,
    packageId: subscription.packageId,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    startsAt: subscription.startsAt.toISOString(),
    endsAt: subscription.endsAt?.toISOString() ?? null,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
    notes: subscription.notes,
  };
}

function ensurePackageCanBeAssigned(plan: Pick<PrismaPackage, "status">, allowInactivePackage: boolean) {
  if (plan.status === "ACTIVE") return;
  if (allowInactivePackage) return;
  throw new AppError("Inactive packages require explicit allowInactivePackage=true.", 400);
}

async function cancelActiveSubscriptions(
  tx: Prisma.TransactionClient,
  actorId: string,
  businessId: string,
  reason: string,
  options: { excludeSubscriptionId?: string; newPackageId?: string } = {},
) {
  const activeSubscriptions = await tx.businessSubscription.findMany({
    where: {
      businessId,
      status: { in: activeSubscriptionStatuses },
      ...(options.excludeSubscriptionId ? { id: { not: options.excludeSubscriptionId } } : {}),
    },
    select: {
      id: true,
      status: true,
      packageId: true,
      businessId: true,
      business: { select: { id: true, name: true } },
      package: { select: { id: true, name: true, slug: true } },
    },
  });

  if (activeSubscriptions.length === 0) return activeSubscriptions;

  await tx.businessSubscription.updateMany({
    where: { id: { in: activeSubscriptions.map((subscription) => subscription.id) } },
    data: { status: "CANCELLED" },
  });

  await Promise.all(
    activeSubscriptions.map((subscription) =>
      createAuditLog(
        {
          actorId,
          action: "SUBSCRIPTION_CANCELLED",
          targetType: "BusinessSubscription",
          targetId: subscription.id,
          metadata: {
            from: subscription.status,
            to: "CANCELLED",
            targetName: subscriptionTargetName(subscription.business.name, subscription.package.name),
            businessId: subscription.businessId,
            businessName: subscription.business.name,
            packageId: subscription.packageId,
            packageName: subscription.package.name,
            packageSlug: subscription.package.slug,
            reason,
            newPackageId: options.newPackageId ?? null,
            oldValue: { status: subscription.status },
            newValue: { status: "CANCELLED" },
          },
        },
        tx,
      ),
    ),
  );

  return activeSubscriptions;
}

async function createSubscriptionForBusiness(
  actorId: string,
  input: AssignSubscriptionInput,
  auditAction: "BUSINESS_PACKAGE_ASSIGNED",
) {
  return prisma.$transaction(async (tx) => {
    const [business, plan] = await Promise.all([
      tx.business.findUnique({
        where: { id: input.businessId },
        select: { id: true, name: true },
      }),
      tx.package.findUnique({
        where: { id: input.packageId },
      }),
    ]);

    if (!business) throw new AppError("Business not found.", 404);
    if (!plan) throw new AppError("Package not found.", 404);
    ensurePackageCanBeAssigned(plan, input.allowInactivePackage);

    const replacedSubscriptions = activeSubscriptionStatuses.includes(input.status)
      ? await cancelActiveSubscriptions(tx, actorId, input.businessId, "REPLACED_BY_PACKAGE_ASSIGNMENT", {
          newPackageId: plan.id,
        })
      : [];

    const subscription = await tx.businessSubscription.create({
      data: {
        businessId: input.businessId,
        packageId: input.packageId,
        status: input.status,
        billingCycle: input.billingCycle,
        startsAt: input.startsAt ?? new Date(),
        endsAt: input.endsAt ?? null,
        trialEndsAt: input.trialEndsAt ?? null,
        notes: input.notes ?? null,
      },
      include: subscriptionInclude,
    });

    await createAuditLog(
      {
        actorId,
        action: auditAction,
        targetType: "BusinessSubscription",
        targetId: subscription.id,
        metadata: {
          targetName: subscriptionTargetName(business.name, plan.name),
          businessId: business.id,
          businessName: business.name,
          packageId: plan.id,
          packageName: plan.name,
          packageSlug: plan.slug,
          packageStatus: plan.status,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          startsAt: subscription.startsAt.toISOString(),
          endsAt: subscription.endsAt?.toISOString() ?? null,
          trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
          allowInactivePackage: input.allowInactivePackage,
          replacedSubscriptionIds: replacedSubscriptions.map((item) => item.id),
          oldValue: null,
          newValue: subscriptionAuditValue(subscription),
        },
      },
      tx,
    );

    return serializeSubscription(subscription);
  });
}

export async function listSubscriptions(
  query: AdminSubscriptionsQuery,
): Promise<PaginatedResult<ReturnType<typeof serializeSubscription>>> {
  const where: Prisma.BusinessSubscriptionWhereInput = {};
  const search = query.search.trim();

  if (search) where.business = { name: { contains: search, mode: "insensitive" } };
  if (query.businessId) where.businessId = query.businessId;
  if (query.packageId) where.packageId = query.packageId;
  if (query.status) where.status = query.status;
  if (query.billingCycle) where.billingCycle = query.billingCycle;

  const skip = (query.page - 1) * query.limit;
  const [subscriptions, total] = await Promise.all([
    prisma.businessSubscription.findMany({
      where,
      include: subscriptionInclude,
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

export async function assignSubscription(actorId: string, input: AssignSubscriptionInput) {
  return createSubscriptionForBusiness(actorId, input, "BUSINESS_PACKAGE_ASSIGNED");
}

export async function getSubscriptionById(id: string) {
  const subscription = await prisma.businessSubscription.findUnique({
    where: { id },
    include: subscriptionInclude,
  });

  if (!subscription) throw new AppError("Subscription not found.", 404);

  return serializeSubscription(subscription);
}

export async function updateSubscriptionStatus(
  actorId: string,
  id: string,
  status: SubscriptionStatus,
  allowInactivePackage = false,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.businessSubscription.findUnique({
      where: { id },
      include: {
        package: true,
        business: { select: { id: true, name: true } },
      },
    });

    if (!existing) throw new AppError("Subscription not found.", 404);

    if (activeSubscriptionStatuses.includes(status)) {
      ensurePackageCanBeAssigned(existing.package, allowInactivePackage);
      await cancelActiveSubscriptions(tx, actorId, existing.businessId, "REPLACED_BY_STATUS_ACTIVATION", {
        excludeSubscriptionId: id,
        newPackageId: existing.packageId,
      });
    }

    const subscription = await tx.businessSubscription.update({
      where: { id },
      data: { status },
      include: subscriptionInclude,
    });

    if (existing.status !== status) {
      await createAuditLog(
        {
          actorId,
          action: statusAuditAction(status),
          targetType: "BusinessSubscription",
          targetId: id,
          metadata: {
            from: existing.status,
            to: status,
            targetName: subscriptionTargetName(existing.business.name, existing.package.name),
            businessId: existing.businessId,
            businessName: existing.business.name,
            packageId: existing.packageId,
            packageName: existing.package.name,
            packageSlug: existing.package.slug,
            allowInactivePackage,
            oldValue: { status: existing.status },
            newValue: { status },
          },
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
      include: {
        package: { select: { id: true, name: true, slug: true } },
        business: { select: { id: true, name: true } },
      },
    });

    if (!existing) throw new AppError("Subscription not found.", 404);

    const subscription = await tx.businessSubscription.update({
      where: { id },
      data: {
        endsAt: input.endsAt,
        notes: input.notes === undefined ? existing.notes : input.notes,
      },
      include: subscriptionInclude,
    });

    await createAuditLog(
      {
        actorId,
        action: "SUBSCRIPTION_EXTENDED",
        targetType: "BusinessSubscription",
        targetId: id,
        metadata: {
          targetName: subscriptionTargetName(existing.business.name, existing.package.name),
          businessId: existing.businessId,
          businessName: existing.business.name,
          packageId: existing.packageId,
          packageName: existing.package.name,
          packageSlug: existing.package.slug,
          previousEndsAt: existing.endsAt?.toISOString() ?? null,
          endsAt: subscription.endsAt?.toISOString() ?? null,
          notesChanged: input.notes !== undefined && input.notes !== existing.notes,
          oldValue: {
            endsAt: existing.endsAt?.toISOString() ?? null,
            notes: existing.notes,
          },
          newValue: {
            endsAt: subscription.endsAt?.toISOString() ?? null,
            notes: subscription.notes,
          },
        },
      },
      tx,
    );

    return serializeSubscription(subscription);
  });
}

export async function changeBusinessPackage(
  actorId: string,
  businessId: string,
  input: ChangeBusinessPackageInput,
) {
  return createSubscriptionForBusiness(
    actorId,
    {
      ...input,
      businessId,
    },
    "BUSINESS_PACKAGE_ASSIGNED",
  );
}

export type SubscriptionBillingCycle = BillingCycle;
