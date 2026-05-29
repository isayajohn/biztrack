import type { Expense } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  dateKey,
  fromPrismaExpenseCategory,
  fromPrismaPaymentMethod,
  money,
  toDateOnly,
  toPrismaExpenseCategory,
  toPrismaPaymentMethod,
} from "../utils/mappers";
import { getDefaultBusinessId } from "./businessAccess.service";
import { checkPackageLimit } from "./packageLimit.service";

type ExpenseInput = {
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  expenseDate: string;
  notes?: string;
};

function serializeExpense(expense: Expense) {
  return {
    ...expense,
    category: fromPrismaExpenseCategory(expense.category),
    amount: money(expense.amount),
    paymentMethod: fromPrismaPaymentMethod(expense.paymentMethod),
    expenseDate: dateKey(expense.expenseDate),
  };
}

export async function listExpenses(userId: string) {
  const businessId = await getDefaultBusinessId(userId);
  const expenses = await prisma.expense.findMany({
    where: { businessId },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });
  return expenses.map((expense) => serializeExpense(expense));
}

export async function getExpense(userId: string, id: string) {
  const businessId = await getDefaultBusinessId(userId);
  const expense = await prisma.expense.findFirst({ where: { id, businessId } });
  if (!expense) throw new AppError("Expense not found.", 404);
  return serializeExpense(expense);
}

export async function createExpense(userId: string, input: ExpenseInput) {
  const businessId = await getDefaultBusinessId(userId);
  const expense = await prisma.$transaction(async (tx) => {
    await checkPackageLimit(businessId, "maxExpensesPerMonth", {
      client: tx,
      date: input.expenseDate,
    });

    return tx.expense.create({
      data: {
        businessId,
        category: toPrismaExpenseCategory(input.category),
        description: input.description,
        amount: input.amount,
        paymentMethod: toPrismaPaymentMethod(input.paymentMethod),
        expenseDate: toDateOnly(input.expenseDate),
        notes: input.notes,
      },
    });
  });
  return serializeExpense(expense);
}

export async function updateExpense(userId: string, id: string, input: Partial<ExpenseInput>) {
  await getExpense(userId, id);
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(input.category ? { category: toPrismaExpenseCategory(input.category) } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.paymentMethod ? { paymentMethod: toPrismaPaymentMethod(input.paymentMethod) } : {}),
      ...(input.expenseDate ? { expenseDate: toDateOnly(input.expenseDate) } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  return serializeExpense(expense);
}

export async function deleteExpense(userId: string, id: string) {
  await getExpense(userId, id);
  await prisma.expense.delete({ where: { id } });
}
