import { Prisma } from "@prisma/client";
import type { PackageStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createAuditLog } from "./audit.service";
import { AppError } from "../utils/AppError";
import { money } from "../utils/mappers";
import type { CreatePackageInput, UpdatePackageInput } from "../validators/adminPackage.validators";

type PackageWithCount = Prisma.PackageGetPayload<{
  include: { _count: { select: { subscriptions: true } } };
}>;

type PackageSnapshotSource = {
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: { toString(): string } | number;
  priceYearly: { toString(): string } | number | null;
  currency: string;
  trialDays: number;
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
  status: PackageStatus;
  sortOrder: number;
};

function serializePackage(plan: PackageWithCount) {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceMonthly: money(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? null : money(plan.priceYearly),
    currency: plan.currency,
    trialDays: plan.trialDays,
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
    status: plan.status,
    sortOrder: plan.sortOrder,
    subscriptionCount: plan._count.subscriptions,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function statusAuditAction(status: PackageStatus) {
  return status === "ACTIVE" ? "PACKAGE_ACTIVATED" : "PACKAGE_DEACTIVATED";
}

function packageSnapshot(plan: PackageSnapshotSource) {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceMonthly: money(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? null : money(plan.priceYearly),
    currency: plan.currency,
    trialDays: plan.trialDays,
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
    status: plan.status,
    sortOrder: plan.sortOrder,
  };
}

async function assertUniqueSlug(
  slug: string,
  tx: Prisma.TransactionClient,
  currentPackageId?: string,
) {
  const existing = await tx.package.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== currentPackageId) {
    throw new AppError("Package slug already exists.", 409);
  }
}

export async function listPackages() {
  const packages = await prisma.package.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return packages.map(serializePackage);
}

export async function getPackageById(id: string) {
  const plan = await prisma.package.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });

  if (!plan) throw new AppError("Package not found.", 404);

  return serializePackage(plan);
}

export async function createPackage(actorId: string, input: CreatePackageInput) {
  return prisma.$transaction(async (tx) => {
    await assertUniqueSlug(input.slug, tx);

    const plan = await tx.package.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly ?? null,
        currency: input.currency,
        trialDays: input.trialDays,
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
        status: input.status,
        sortOrder: input.sortOrder,
      },
      include: { _count: { select: { subscriptions: true } } },
    });

    await createAuditLog(
      {
        actorId,
        action: "PACKAGE_CREATED",
        targetType: "Package",
        targetId: plan.id,
        metadata: {
          targetName: plan.name,
          slug: plan.slug,
          status: plan.status,
          oldValue: null,
          newValue: packageSnapshot(plan),
        },
      },
      tx,
    );

    return serializePackage(plan);
  });
}

export async function updatePackage(actorId: string, id: string, input: UpdatePackageInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.package.findUnique({ where: { id } });
    if (!existing) throw new AppError("Package not found.", 404);

    if (input.slug !== undefined) {
      await assertUniqueSlug(input.slug, tx, id);
    }

    const data: Prisma.PackageUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
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

    const changedFields = Object.keys(input);
    await createAuditLog(
      {
        actorId,
        action: "PACKAGE_UPDATED",
        targetType: "Package",
        targetId: id,
        metadata: {
          targetName: plan.name,
          changedFields,
          slug: plan.slug,
          oldValue: packageSnapshot(existing),
          newValue: packageSnapshot(plan),
        },
      },
      tx,
    );

    if (input.status && input.status !== existing.status) {
      await createAuditLog(
        {
          actorId,
          action: statusAuditAction(input.status),
          targetType: "Package",
          targetId: id,
          metadata: {
            targetName: plan.name,
            slug: plan.slug,
            oldValue: { status: existing.status },
            newValue: { status: input.status },
          },
        },
        tx,
      );
    }

    return serializePackage(plan);
  });
}

export async function updatePackageStatus(actorId: string, id: string, status: PackageStatus) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.package.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, slug: true },
    });

    if (!existing) throw new AppError("Package not found.", 404);

    const plan = await tx.package.update({
      where: { id },
      data: { status },
      include: { _count: { select: { subscriptions: true } } },
    });

    if (existing.status !== status) {
      await createAuditLog(
        {
          actorId,
          action: statusAuditAction(status),
          targetType: "Package",
          targetId: id,
          metadata: {
            targetName: plan.name,
            slug: existing.slug,
            oldValue: { status: existing.status },
            newValue: { status },
          },
        },
        tx,
      );
    }

    return serializePackage(plan);
  });
}

export async function deletePackage(actorId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.package.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });

    if (!existing) throw new AppError("Package not found.", 404);
    if (existing._count.subscriptions > 0) {
      throw new AppError("Package cannot be deleted while businesses are using it.", 409, {
        subscriptionCount: existing._count.subscriptions,
      });
    }

    await tx.package.delete({ where: { id } });

    await createAuditLog(
      {
        actorId,
        action: "PACKAGE_DELETED",
        targetType: "Package",
        targetId: id,
        metadata: {
          targetName: existing.name,
          slug: existing.slug,
          status: existing.status,
          oldValue: packageSnapshot(existing),
          newValue: null,
        },
      },
      tx,
    );
  });
}
