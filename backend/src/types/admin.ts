import type { SystemRole, UserStatus } from "@prisma/client";

export type PaginationInput = {
  page: number;
  limit: number;
};

export type PaginationMeta = PaginationInput & {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type AdminUsersQuery = PaginationInput & {
  search: string;
  role?: SystemRole;
  status?: UserStatus;
};

export type AdminBusinessesQuery = PaginationInput & {
  search: string;
  country: string;
};

export type AdminAuditLogsQuery = PaginationInput & {
  action?: string;
  actor: string;
  date?: string;
  search: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  businessCount?: number;
  businesses?: Array<{
    id: string;
    name: string;
    country: string;
    currency: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminBusiness = {
  id: string;
  name: string;
  country: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  user: Pick<AdminUser, "id" | "name" | "email" | "role" | "status">;
  _count: {
    products: number;
    sales: number;
    expenses: number;
  };
  totalSalesAmount: number;
  totalExpensesAmount: number;
};

export type AdminSaleSummary = {
  id: string;
  saleDate: string;
  productName: string | null;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: Date;
};

export type AdminExpenseSummary = {
  id: string;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdAt: Date;
};

export type AdminBusinessDetails = AdminBusiness & {
  totalSalesAmount: number;
  totalExpensesAmount: number;
  recentSales: AdminSaleSummary[];
  recentExpenses: AdminExpenseSummary[];
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalBusinesses: number;
  totalSalesAmount: number;
  totalExpensesAmount: number;
  totalProducts: number;
  recentUsers: AdminUser[];
  recentBusinesses: AdminBusiness[];
};

export type AdminAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  targetUserId: string | null;
  details: unknown;
  createdAt: Date;
  actor: Pick<AdminUser, "id" | "name" | "email"> | null;
};
