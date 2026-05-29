import type { Expense } from "../types/expense";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";

export type ReportRangePreset = "today" | "week" | "month" | "custom";

export type ReportDateRange = {
  preset: ReportRangePreset;
  startDate: string;
  endDate: string;
};

export type ReportSummary = {
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  numberOfSales: number;
  numberOfExpenses: number;
};

export type ProductPerformanceRow = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  grossProfit: number;
};

export type LowStockProductRow = {
  id: string;
  name: string;
  stock: number;
  lowStockLevel: number;
};

export type SalesExpenseChartRow = {
  date: string;
  label: string;
  sales: number;
  expenses: number;
};

export type ProfitChartRow = {
  date: string;
  label: string;
  grossProfit: number;
  netProfit: number;
};

export type CategoryChartRow = {
  name: string;
  value: number;
};

export type PaymentChartRow = {
  name: string;
  value: number;
};

export type ReportTableItem = {
  id: string;
  type: "sale" | "expense";
  title: string;
  detail: string;
  amount: number;
  profit?: number;
  paymentMethod: string;
};

export type ReportTableGroup = {
  date: string;
  label: string;
  salesTotal: number;
  expensesTotal: number;
  netTotal: number;
  items: ReportTableItem[];
};

export type ReportData = {
  filteredSales: Sale[];
  filteredExpenses: Expense[];
  summary: ReportSummary;
  bestSellingProducts: ProductPerformanceRow[];
  mostProfitableProducts: ProductPerformanceRow[];
  lowStockProducts: LowStockProductRow[];
  salesVsExpenses: SalesExpenseChartRow[];
  profitChart: ProfitChartRow[];
  expenseByCategory: CategoryChartRow[];
  salesByPaymentMethod: PaymentChartRow[];
  tableGroups: ReportTableGroup[];
};

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultReportRange(preset: ReportRangePreset): ReportDateRange {
  const today = new Date();
  const start = new Date(today);

  if (preset === "week") {
    const day = today.getDay();
    start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  }

  if (preset === "month") {
    start.setDate(1);
  }

  return {
    preset,
    startDate: formatDateKey(start),
    endDate: formatDateKey(today),
  };
}

export function isWithinReportRange(dateKey: string, range: ReportDateRange): boolean {
  return dateKey >= range.startDate && dateKey <= range.endDate;
}

export function formatReportDate(dateKey: string, includeYear = false): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
  });
}

function getProductCostMap(products: Product[]): Map<string, number> {
  return new Map(products.map((product) => [product.id, product.buyingPrice]));
}

function getSaleGrossProfit(sale: Sale, productCostMap: Map<string, number>): number {
  const unitCost = productCostMap.get(sale.productId) ?? 0;
  return sale.totalAmount - unitCost * sale.quantity;
}

function createDateBucket(date: string): SalesExpenseChartRow {
  return {
    date,
    label: formatReportDate(date),
    sales: 0,
    expenses: 0,
  };
}

function createProfitBucket(date: string): ProfitChartRow {
  return {
    date,
    label: formatReportDate(date),
    grossProfit: 0,
    netProfit: 0,
  };
}

export function buildReportData(
  products: Product[],
  sales: Sale[],
  expenses: Expense[],
  range: ReportDateRange,
): ReportData {
  const productCostMap = getProductCostMap(products);
  const filteredSales = sales.filter((sale) => isWithinReportRange(sale.saleDate, range));
  const filteredExpenses = expenses.filter((expense) =>
    isWithinReportRange(expense.expenseDate, range),
  );

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const grossProfit = filteredSales.reduce(
    (sum, sale) => sum + getSaleGrossProfit(sale, productCostMap),
    0,
  );
  const netProfit = grossProfit - totalExpenses;

  const productMap = new Map<string, ProductPerformanceRow>();
  for (const sale of filteredSales) {
    const current =
      productMap.get(sale.productId) ??
      ({
        productId: sale.productId,
        productName: sale.productName,
        quantitySold: 0,
        revenue: 0,
        grossProfit: 0,
      } satisfies ProductPerformanceRow);

    current.quantitySold += sale.quantity;
    current.revenue += sale.totalAmount;
    current.grossProfit += getSaleGrossProfit(sale, productCostMap);
    productMap.set(sale.productId, current);
  }

  const productPerformance = Array.from(productMap.values());
  const bestSellingProducts = [...productPerformance]
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
    .slice(0, 5);
  const mostProfitableProducts = [...productPerformance]
    .sort((a, b) => b.grossProfit - a.grossProfit || b.revenue - a.revenue)
    .slice(0, 5);
  const lowStockProducts = products
    .filter((product) => product.stock <= product.lowStockLevel)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      lowStockLevel: product.lowStockLevel,
    }));

  const salesExpenseMap = new Map<string, SalesExpenseChartRow>();
  const profitMap = new Map<string, ProfitChartRow>();
  const tableMap = new Map<string, ReportTableGroup>();
  const expenseCategoryMap = new Map<string, number>();
  const paymentMethodMap = new Map<string, number>();

  const ensureTableGroup = (date: string) => {
    const existing = tableMap.get(date);
    if (existing) return existing;
    const group: ReportTableGroup = {
      date,
      label: formatReportDate(date, true),
      salesTotal: 0,
      expensesTotal: 0,
      netTotal: 0,
      items: [],
    };
    tableMap.set(date, group);
    return group;
  };

  for (const sale of filteredSales) {
    const salesExpenseBucket =
      salesExpenseMap.get(sale.saleDate) ?? createDateBucket(sale.saleDate);
    salesExpenseBucket.sales += sale.totalAmount;
    salesExpenseMap.set(sale.saleDate, salesExpenseBucket);

    const profitBucket = profitMap.get(sale.saleDate) ?? createProfitBucket(sale.saleDate);
    profitBucket.grossProfit += getSaleGrossProfit(sale, productCostMap);
    profitBucket.netProfit += getSaleGrossProfit(sale, productCostMap);
    profitMap.set(sale.saleDate, profitBucket);

    paymentMethodMap.set(
      sale.paymentMethod,
      (paymentMethodMap.get(sale.paymentMethod) ?? 0) + sale.totalAmount,
    );

    const group = ensureTableGroup(sale.saleDate);
    const saleProfit = getSaleGrossProfit(sale, productCostMap);
    group.salesTotal += sale.totalAmount;
    group.netTotal += saleProfit;
    group.items.push({
      id: sale.id,
      type: "sale",
      title: sale.productName,
      detail: `${sale.quantity} x ${sale.unitPrice}`,
      amount: sale.totalAmount,
      profit: saleProfit,
      paymentMethod: sale.paymentMethod,
    });
  }

  for (const expense of filteredExpenses) {
    const salesExpenseBucket =
      salesExpenseMap.get(expense.expenseDate) ?? createDateBucket(expense.expenseDate);
    salesExpenseBucket.expenses += expense.amount;
    salesExpenseMap.set(expense.expenseDate, salesExpenseBucket);

    const profitBucket =
      profitMap.get(expense.expenseDate) ?? createProfitBucket(expense.expenseDate);
    profitBucket.netProfit -= expense.amount;
    profitMap.set(expense.expenseDate, profitBucket);

    expenseCategoryMap.set(
      expense.category,
      (expenseCategoryMap.get(expense.category) ?? 0) + expense.amount,
    );

    const group = ensureTableGroup(expense.expenseDate);
    group.expensesTotal += expense.amount;
    group.netTotal -= expense.amount;
    group.items.push({
      id: expense.id,
      type: "expense",
      title: expense.description,
      detail: expense.category,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
    });
  }

  const salesVsExpenses = Array.from(salesExpenseMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const profitChart = Array.from(profitMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const expenseByCategory = Array.from(expenseCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const salesByPaymentMethod = Array.from(paymentMethodMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const tableGroups = Array.from(tableMap.values())
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.type.localeCompare(b.type)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    filteredSales,
    filteredExpenses,
    summary: {
      totalSales,
      totalExpenses,
      grossProfit,
      netProfit,
      numberOfSales: filteredSales.length,
      numberOfExpenses: filteredExpenses.length,
    },
    bestSellingProducts,
    mostProfitableProducts,
    lowStockProducts,
    salesVsExpenses,
    profitChart,
    expenseByCategory,
    salesByPaymentMethod,
    tableGroups,
  };
}

function csvEscape(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildReportCsv(data: ReportData): string {
  const rows: Array<Array<string | number>> = [
    [
      "Date",
      "Type",
      "Title",
      "Detail",
      "Payment Method",
      "Amount",
      "Gross Profit",
    ],
  ];

  for (const group of data.tableGroups) {
    for (const item of group.items) {
      rows.push([
        group.date,
        item.type === "sale" ? "Sale" : "Expense",
        item.title,
        item.detail,
        item.paymentMethod,
        item.amount,
        item.profit ?? "",
      ]);
    }
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}
