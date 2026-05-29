import { prisma } from "../config/prisma";
import {
  dateKey,
  fromPrismaExpenseCategory,
  fromPrismaPaymentMethod,
  money,
  toDateOnly,
} from "../utils/mappers";
import { getDefaultBusinessId } from "./businessAccess.service";
import { checkPackageFeature } from "./packageLimit.service";

type DateRange = {
  startDate: string;
  endDate: string;
};

type ReportOptions = {
  enforcePackage?: boolean;
};

type SaleForReport = Awaited<ReturnType<typeof prisma.sale.findMany>>[number] & {
  product: { id: string; name: string; buyingPrice: { toString(): string } } | null;
};

function saleProfit(sale: SaleForReport) {
  const unitCost = sale.product ? money(sale.product.buyingPrice) : 0;
  return money(sale.totalAmount) - sale.quantity * unitCost;
}

export async function getReportsByDateRange(
  userId: string,
  range: DateRange,
  options: ReportOptions = {},
) {
  const businessId = await getDefaultBusinessId(userId);
  const subscription =
    options.enforcePackage === false
      ? null
      : await checkPackageFeature(businessId, "allowReports");
  const canShowInventoryAlerts = subscription?.package.allowInventoryAlerts ?? true;
  const start = toDateOnly(range.startDate);
  const end = toDateOnly(range.endDate);
  const [products, sales, expenses] = await Promise.all([
    prisma.product.findMany({ where: { businessId } }),
    prisma.sale.findMany({
      where: { businessId, saleDate: { gte: start, lte: end } },
      include: { product: true },
      orderBy: [{ saleDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.expense.findMany({
      where: { businessId, expenseDate: { gte: start, lte: end } },
      orderBy: [{ expenseDate: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const totalSales = sales.reduce((sum, sale) => sum + money(sale.totalAmount), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + money(expense.amount), 0);
  const grossProfit = sales.reduce((sum, sale) => sum + saleProfit(sale), 0);
  const netProfit = grossProfit - totalExpenses;

  const productMap = new Map<
    string,
    { productId: string; productName: string; quantitySold: number; revenue: number; grossProfit: number }
  >();
  const dailyMap = new Map<
    string,
    { date: string; sales: number; expenses: number; grossProfit: number; netProfit: number }
  >();
  const categoryMap = new Map<string, number>();
  const paymentMap = new Map<string, number>();
  const tableMap = new Map<
    string,
    {
      date: string;
      salesTotal: number;
      expensesTotal: number;
      netTotal: number;
      items: Array<Record<string, unknown>>;
    }
  >();

  const ensureDaily = (date: string) => {
    const current = dailyMap.get(date);
    if (current) return current;
    const created = { date, sales: 0, expenses: 0, grossProfit: 0, netProfit: 0 };
    dailyMap.set(date, created);
    return created;
  };

  const ensureTable = (date: string) => {
    const current = tableMap.get(date);
    if (current) return current;
    const created = { date, salesTotal: 0, expensesTotal: 0, netTotal: 0, items: [] };
    tableMap.set(date, created);
    return created;
  };

  for (const sale of sales) {
    const key = dateKey(sale.saleDate);
    const profit = saleProfit(sale);
    const productName = sale.product?.name ?? "Manual sale";
    const productId = sale.productId ?? "manual";
    const daily = ensureDaily(key);
    daily.sales += money(sale.totalAmount);
    daily.grossProfit += profit;
    daily.netProfit += profit;

    const productRow =
      productMap.get(productId) ??
      {
        productId,
        productName,
        quantitySold: 0,
        revenue: 0,
        grossProfit: 0,
      };
    productRow.quantitySold += sale.quantity;
    productRow.revenue += money(sale.totalAmount);
    productRow.grossProfit += profit;
    productMap.set(productId, productRow);

    const payment = fromPrismaPaymentMethod(sale.paymentMethod);
    paymentMap.set(payment, (paymentMap.get(payment) ?? 0) + money(sale.totalAmount));

    const group = ensureTable(key);
    group.salesTotal += money(sale.totalAmount);
    group.netTotal += profit;
    group.items.push({
      id: sale.id,
      type: "sale",
      title: productName,
      amount: money(sale.totalAmount),
      grossProfit: profit,
      paymentMethod: payment,
    });
  }

  for (const expense of expenses) {
    const key = dateKey(expense.expenseDate);
    const daily = ensureDaily(key);
    daily.expenses += money(expense.amount);
    daily.netProfit -= money(expense.amount);

    const category = fromPrismaExpenseCategory(expense.category);
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + money(expense.amount));

    const group = ensureTable(key);
    group.expensesTotal += money(expense.amount);
    group.netTotal -= money(expense.amount);
    group.items.push({
      id: expense.id,
      type: "expense",
      title: expense.description,
      category,
      amount: money(expense.amount),
      paymentMethod: fromPrismaPaymentMethod(expense.paymentMethod),
    });
  }

  const productPerformance = Array.from(productMap.values());

  return {
    range,
    summary: {
      totalSales,
      totalExpenses,
      grossProfit,
      netProfit,
      numberOfSales: sales.length,
      numberOfExpenses: expenses.length,
    },
    productPerformance: {
      bestSellingProducts: [...productPerformance]
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5),
      mostProfitableProducts: [...productPerformance]
        .sort((a, b) => b.grossProfit - a.grossProfit)
        .slice(0, 5),
      lowStockProducts: canShowInventoryAlerts
        ? products
            .filter((product) => product.stockQuantity <= product.lowStockLevel)
            .map((product) => ({
              id: product.id,
              name: product.name,
              stock: product.stockQuantity,
              lowStockLevel: product.lowStockLevel,
            }))
        : [],
    },
    charts: {
      salesVsExpenses: Array.from(dailyMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      profit: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      expenseByCategory: Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      })),
      salesByPaymentMethod: Array.from(paymentMap.entries()).map(([name, value]) => ({
        name,
        value,
      })),
    },
    tableGroups: Array.from(tableMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export async function getDashboard(userId: string) {
  const today = new Date();
  const todayKey = dateKey(today);
  const monthStart = `${todayKey.slice(0, 7)}-01`;

  const [todayReport, monthReport] = await Promise.all([
    getReportsByDateRange(userId, { startDate: todayKey, endDate: todayKey }, { enforcePackage: false }),
    getReportsByDateRange(userId, { startDate: monthStart, endDate: todayKey }, { enforcePackage: false }),
  ]);

  return {
    today: todayReport.summary,
    month: monthReport.summary,
    charts: monthReport.charts,
    productPerformance: monthReport.productPerformance,
  };
}
