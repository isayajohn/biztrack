import { Prisma } from "@prisma/client";
import type { PaymentTransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import type { PaginatedResult, PaginationMeta } from "../types/admin";
import { money } from "../utils/mappers";
import type { AdminCollectionsQuery } from "../validators/adminCollection.validators";

const collectionInclude = {
  business: {
    select: {
      id: true,
      name: true,
      currency: true,
      country: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  package: {
    select: {
      id: true,
      name: true,
      slug: true,
      currency: true,
      priceMonthly: true,
      priceYearly: true,
    },
  },
} satisfies Prisma.PaymentTransactionInclude;

type CollectionWithDetails = Prisma.PaymentTransactionGetPayload<{
  include: typeof collectionInclude;
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

function serializeCollection(collection: CollectionWithDetails) {
  return {
    id: collection.id,
    businessId: collection.businessId,
    packageId: collection.packageId,
    subscriptionId: collection.subscriptionId,
    status: collection.status,
    billingCycle: collection.billingCycle,
    amount: money(collection.amount),
    currency: collection.currency,
    provider: collection.provider,
    externalId: collection.externalId,
    providerReference: collection.providerReference,
    checkoutUrl: collection.checkoutUrl,
    paidAt: collection.paidAt,
    failedAt: collection.failedAt,
    business: collection.business,
    package: {
      ...collection.package,
      priceMonthly: money(collection.package.priceMonthly),
      priceYearly:
        collection.package.priceYearly == null ? null : money(collection.package.priceYearly),
    },
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}

export async function listCollections(
  query: AdminCollectionsQuery,
): Promise<PaginatedResult<ReturnType<typeof serializeCollection>>> {
  const where: Prisma.PaymentTransactionWhereInput = {};
  const search = query.search.trim();

  if (query.status) where.status = query.status as PaymentTransactionStatus;
  if (query.packageId) where.packageId = query.packageId;
  if (query.businessId) where.businessId = query.businessId;
  if (search) {
    where.OR = [
      { externalId: { contains: search, mode: "insensitive" } },
      { providerReference: { contains: search, mode: "insensitive" } },
      { business: { name: { contains: search, mode: "insensitive" } } },
      { business: { user: { email: { contains: search, mode: "insensitive" } } } },
      { package: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [collections, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include: collectionInclude,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: query.limit,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  return {
    items: collections.map(serializeCollection),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getCollectionStats() {
  const [grouped, latest] = await Promise.all([
    prisma.paymentTransaction.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.findMany({
      include: collectionInclude,
      orderBy: [{ createdAt: "desc" }],
      take: 5,
    }),
  ]);

  const totals = grouped.reduce(
    (acc, item) => {
      const amount = money(item._sum.amount ?? 0);
      acc.totalCount += item._count._all;
      acc.totalAmount += amount;
      acc.byStatus[item.status] = {
        count: item._count._all,
        amount,
      };
      return acc;
    },
    {
      totalCount: 0,
      totalAmount: 0,
      byStatus: {} as Record<PaymentTransactionStatus, { count: number; amount: number }>,
    },
  );

  return {
    ...totals,
    latest: latest.map(serializeCollection),
  };
}
