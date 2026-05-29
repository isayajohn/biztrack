import { Prisma } from "@prisma/client";
import type {
  ExpenseCategory,
  PaymentMethod,
  SystemRole,
  UserStatus,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { createAuditLog } from "./audit.service";
import type {
  AdminAuditLog,
  AdminAuditLogsQuery,
  AdminBusiness,
  AdminBusinessDetails,
  AdminExpenseSummary,
  AdminSaleSummary,
  AdminBusinessesQuery,
  AdminStats,
  AdminUser,
  AdminUsersQuery,
  PaginatedResult,
  PaginationMeta,
} from "../types/admin";
import { AppError } from "../utils/AppError";
import {
  dateKey,
  fromPrismaExpenseCategory,
  fromPrismaPaymentMethod,
  money,
} from "../utils/mappers";

type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  businesses?: Array<{ id: string; name: string; country: string; currency: string; createdAt: Date }>;
  _count?: { businesses: number };
};

type AdminBusinessRecord = {
  id: string;
  name: string;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: SystemRole;
    status: UserStatus;
  };
  _count: {
    products: number;
    sales: number;
    expenses: number;
  };
};

type BusinessTotals = {
  totalSalesAmount: number;
  totalExpensesAmount: number;
};

type AdminSaleRecord = {
  id: string;
  saleDate: Date;
  quantity: number;
  totalAmount: { toString(): string };
  paymentMethod: PaymentMethod;
  createdAt: Date;
  product: { name: string } | null;
};

type AdminExpenseRecord = {
  id: string;
  expenseDate: Date;
  category: ExpenseCategory;
  description: string;
  amount: { toString(): string };
  paymentMethod: PaymentMethod;
  createdAt: Date;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { businesses: true } },
} satisfies Prisma.UserSelect;

const adminBusinessSelect = {
  id: true,
  name: true,
  country: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, role: true, status: true } },
  _count: { select: { products: true, sales: true, expenses: true } },
} satisfies Prisma.BusinessSelect;

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

function serializeAdminUser(user: AdminUserRecord): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    businesses: user.businesses,
    businessCount: user._count?.businesses,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function serializeAdminBusiness(
  business: AdminBusinessRecord,
  totals: BusinessTotals = { totalSalesAmount: 0, totalExpensesAmount: 0 },
): AdminBusiness {
  return {
    id: business.id,
    name: business.name,
    country: business.country,
    currency: business.currency,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    user: business.user,
    _count: business._count,
    totalSalesAmount: money(totals.totalSalesAmount),
    totalExpensesAmount: money(totals.totalExpensesAmount),
  };
}

function serializeAdminSale(sale: AdminSaleRecord): AdminSaleSummary {
  return {
    id: sale.id,
    saleDate: dateKey(sale.saleDate),
    productName: sale.product?.name ?? null,
    quantity: sale.quantity,
    totalAmount: money(sale.totalAmount),
    paymentMethod: fromPrismaPaymentMethod(sale.paymentMethod),
    createdAt: sale.createdAt,
  };
}

function serializeAdminExpense(expense: AdminExpenseRecord): AdminExpenseSummary {
  return {
    id: expense.id,
    expenseDate: dateKey(expense.expenseDate),
    category: fromPrismaExpenseCategory(expense.category),
    description: expense.description,
    amount: money(expense.amount),
    paymentMethod: fromPrismaPaymentMethod(expense.paymentMethod),
    createdAt: expense.createdAt,
  };
}

async function getBusinessTotalsById(businessIds: string[]): Promise<Map<string, BusinessTotals>> {
  const totalsById = new Map<string, BusinessTotals>();

  businessIds.forEach((id) => {
    totalsById.set(id, { totalSalesAmount: 0, totalExpensesAmount: 0 });
  });

  if (businessIds.length === 0) return totalsById;

  const [salesTotals, expenseTotals] = await Promise.all([
    prisma.sale.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _sum: { amount: true },
    }),
  ]);

  salesTotals.forEach((row) => {
    const current = totalsById.get(row.businessId) ?? {
      totalSalesAmount: 0,
      totalExpensesAmount: 0,
    };
    totalsById.set(row.businessId, {
      ...current,
      totalSalesAmount: money(row._sum.totalAmount ?? 0),
    });
  });

  expenseTotals.forEach((row) => {
    const current = totalsById.get(row.businessId) ?? {
      totalSalesAmount: 0,
      totalExpensesAmount: 0,
    };
    totalsById.set(row.businessId, {
      ...current,
      totalExpensesAmount: money(row._sum.amount ?? 0),
    });
  });

  return totalsById;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalBusinesses,
    totalProducts,
    sales,
    expenses,
    recentUsers,
    recentBusinesses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.business.count(),
    prisma.product.count(),
    prisma.sale.aggregate({ _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({
      select: adminUserSelect,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.business.findMany({
      select: adminBusinessSelect,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const recentBusinessTotalsById = await getBusinessTotalsById(
    recentBusinesses.map((business) => business.id),
  );

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalBusinesses,
    totalSalesAmount: money(sales._sum.totalAmount ?? 0),
    totalExpensesAmount: money(expenses._sum.amount ?? 0),
    totalProducts,
    recentUsers: recentUsers.map(serializeAdminUser),
    recentBusinesses: recentBusinesses.map((business) =>
      serializeAdminBusiness(business, recentBusinessTotalsById.get(business.id)),
    ),
  };
}

export async function listUsers(query: AdminUsersQuery): Promise<PaginatedResult<AdminUser>> {
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map(serializeAdminUser),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getUserDetails(actorId: string, id: string): Promise<AdminUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      businesses: {
        select: { id: true, name: true, country: true, currency: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { businesses: true } },
    },
  });

  if (!user) throw new AppError("User not found.", 404);

  await createAuditLog({
    actorId,
    action: "USER_DETAILS_VIEWED",
    targetType: "User",
    targetId: id,
    metadata: {
      viewedFields: ["name", "email", "role", "status", "lastLoginAt", "businesses"],
      businessCount: user._count.businesses,
    },
  });

  return serializeAdminUser(user);
}

export async function updateUserStatus(
  actorId: string,
  targetUserId: string,
  status: UserStatus,
): Promise<AdminUser> {
  if (actorId === targetUserId && status === "SUSPENDED") {
    throw new AppError("You cannot suspend your own account.", 403);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: targetUserId },
      select: adminUserSelect,
    });

    if (!existing) throw new AppError("User not found.", 404);

    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { status },
      select: adminUserSelect,
    });

    if (existing.status !== status) {
      await createAuditLog(
        {
          actorId,
          action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
          targetType: "User",
          targetId: targetUserId,
          metadata: {
            from: existing.status,
            to: status,
          },
        },
        tx,
      );
    }

    return serializeAdminUser(user);
  });
}

export async function updateUserRole(
  actorId: string,
  targetUserId: string,
  role: SystemRole,
): Promise<AdminUser> {
  if (actorId === targetUserId && role !== "SUPER_ADMIN") {
    throw new AppError("You cannot remove your own SUPER_ADMIN role.", 403);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: targetUserId },
      select: adminUserSelect,
    });

    if (!existing) throw new AppError("User not found.", 404);

    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { role },
      select: adminUserSelect,
    });

    if (existing.role !== role) {
      await createAuditLog(
        {
          actorId,
          action: "USER_ROLE_CHANGED",
          targetType: "User",
          targetId: targetUserId,
          metadata: {
            from: existing.role,
            to: role,
          },
        },
        tx,
      );
    }

    return serializeAdminUser(user);
  });
}

export async function deleteUser(actorId: string, targetUserId: string) {
  if (actorId === targetUserId) {
    throw new AppError("You cannot delete your own account.", 403);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { businesses: true, authTokens: true } },
      },
    });

    if (!existing) throw new AppError("User not found.", 404);

    if (existing.role === "SUPER_ADMIN") {
      const superAdminCount = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
      if (superAdminCount <= 1) {
        throw new AppError("You cannot delete the last SUPER_ADMIN account.", 403);
      }
    }

    await createAuditLog(
      {
        actorId,
        action: "USER_DELETED",
        targetType: "User",
        targetId: targetUserId,
        metadata: {
          targetName: existing.name,
          targetEmail: existing.email,
          role: existing.role,
          businessCount: existing._count.businesses,
        },
      },
      tx,
    );

    await tx.user.delete({ where: { id: targetUserId } });

    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
    };
  });
}

export async function listBusinesses(
  query: AdminBusinessesQuery,
): Promise<PaginatedResult<AdminBusiness>> {
  const where: Prisma.BusinessWhereInput = {};

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  if (query.country) {
    where.country = { equals: query.country, mode: "insensitive" };
  }

  const skip = (query.page - 1) * query.limit;
  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      select: adminBusinessSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.business.count({ where }),
  ]);

  const totalsById = await getBusinessTotalsById(businesses.map((business) => business.id));

  return {
    items: businesses.map((business) => serializeAdminBusiness(business, totalsById.get(business.id))),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getBusinessDetails(id: string): Promise<AdminBusinessDetails> {
  const business = await prisma.business.findUnique({
    where: { id },
    select: adminBusinessSelect,
  });

  if (!business) throw new AppError("Business not found.", 404);

  const [sales, expenses, recentSales, recentExpenses] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId: id },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId: id },
      _sum: { amount: true },
    }),
    prisma.sale.findMany({
      where: { businessId: id },
      select: {
        id: true,
        saleDate: true,
        quantity: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        product: { select: { name: true } },
      },
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.expense.findMany({
      where: { businessId: id },
      select: {
        id: true,
        expenseDate: true,
        category: true,
        description: true,
        amount: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
  ]);

  const totals = {
    totalSalesAmount: money(sales._sum.totalAmount ?? 0),
    totalExpensesAmount: money(expenses._sum.amount ?? 0),
  };

  return {
    ...serializeAdminBusiness(business, totals),
    recentSales: recentSales.map((sale) => serializeAdminSale(sale as AdminSaleRecord)),
    recentExpenses: recentExpenses.map((expense) =>
      serializeAdminExpense(expense as AdminExpenseRecord),
    ),
  };
}

export async function getSystemSummary() {
  const [salesByDay, expensesByCategory] = await Promise.all([
    prisma.sale.groupBy({
      by: ["saleDate"],
      _sum: { totalAmount: true },
      _count: { _all: true },
      orderBy: { saleDate: "desc" },
      take: 30,
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  return {
    salesByDay: salesByDay.map((row) => ({
      date: row.saleDate.toISOString().slice(0, 10),
      total: money(row._sum.totalAmount ?? 0),
      count: row._count._all,
    })),
    expensesByCategory: expensesByCategory.map((row) => ({
      category: fromPrismaExpenseCategory(row.category),
      total: money(row._sum.amount ?? 0),
      count: row._count._all,
    })),
  };
}

function safeMetadataText(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function serializeAuditLog(log: AdminAuditLog): AdminAuditLog {
  return log;
}

export async function listAuditLogs(
  query: AdminAuditLogsQuery,
): Promise<PaginatedResult<AdminAuditLog>> {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.action) where.action = query.action;

  if (query.actor) {
    const actorFilters: Prisma.UserWhereInput[] = [
      { name: { contains: query.actor, mode: "insensitive" } },
      { email: { contains: query.actor, mode: "insensitive" } },
    ];

    if (UUID_RE.test(query.actor)) actorFilters.push({ id: query.actor });

    where.actor = {
      is: {
        OR: actorFilters,
      },
    };
  }

  if (query.date) {
    const start = new Date(`${query.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      targetUserId: true,
      details: true,
      createdAt: true,
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedSearch = query.search.toLowerCase();
  const filteredLogs = normalizedSearch
    ? logs.filter((log) => {
        const targetId = (log.targetId ?? log.targetUserId ?? "").toLowerCase();
        const metadata = safeMetadataText(log.metadata ?? log.details);
        return targetId.includes(normalizedSearch) || metadata.includes(normalizedSearch);
      })
    : logs;

  const skip = (query.page - 1) * query.limit;
  const items = filteredLogs.slice(skip, skip + query.limit).map((log) =>
    serializeAuditLog(log as AdminAuditLog),
  );

  return {
    items,
    pagination: buildPagination(query.page, query.limit, filteredLogs.length),
  };
}
