import type { ExpenseCategory, PaymentMethod } from "@prisma/client";

const paymentToPrisma: Record<string, PaymentMethod> = {
  Cash: "CASH",
  "Mobile Money": "MOBILE_MONEY",
  Bank: "BANK",
  Credit: "CREDIT",
  CASH: "CASH",
  MOBILE_MONEY: "MOBILE_MONEY",
  BANK: "BANK",
  CREDIT: "CREDIT",
};

const paymentFromPrisma: Record<PaymentMethod, string> = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  BANK: "Bank",
  CREDIT: "Credit",
};

const categoryToPrisma: Record<string, ExpenseCategory> = {
  "Stock Purchase": "STOCK_PURCHASE",
  Rent: "RENT",
  Transport: "TRANSPORT",
  Salary: "SALARY",
  Electricity: "ELECTRICITY",
  Internet: "INTERNET",
  Food: "FOOD",
  Marketing: "MARKETING",
  Other: "OTHER",
  STOCK_PURCHASE: "STOCK_PURCHASE",
  RENT: "RENT",
  TRANSPORT: "TRANSPORT",
  SALARY: "SALARY",
  ELECTRICITY: "ELECTRICITY",
  INTERNET: "INTERNET",
  FOOD: "FOOD",
  MARKETING: "MARKETING",
  OTHER: "OTHER",
};

const categoryFromPrisma: Record<ExpenseCategory, string> = {
  STOCK_PURCHASE: "Stock Purchase",
  RENT: "Rent",
  TRANSPORT: "Transport",
  SALARY: "Salary",
  ELECTRICITY: "Electricity",
  INTERNET: "Internet",
  FOOD: "Food",
  MARKETING: "Marketing",
  OTHER: "Other",
};

export function toPrismaPaymentMethod(value: string): PaymentMethod {
  return paymentToPrisma[value];
}

export function fromPrismaPaymentMethod(value: PaymentMethod): string {
  return paymentFromPrisma[value];
}

export function toPrismaExpenseCategory(value: string): ExpenseCategory {
  return categoryToPrisma[value];
}

export function fromPrismaExpenseCategory(value: ExpenseCategory): string {
  return categoryFromPrisma[value];
}

export function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function money(value: { toString(): string } | number): number {
  return Number(value.toString());
}
