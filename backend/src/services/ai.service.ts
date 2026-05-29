import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { dateKey } from "../utils/mappers";
import { getDefaultBusinessId } from "./businessAccess.service";
import { getBusinessProfile } from "./business.service";
import { checkPackageFeature } from "./packageLimit.service";
import { getReportsByDateRange } from "./report.service";

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function trendDirection(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "up" : "stable";
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

function sumDailySales(
  rows: Array<{ date: string; sales: number }>,
  startDate: string,
  endDate: string,
) {
  return rows
    .filter((row) => row.date >= startDate && row.date <= endDate)
    .reduce((sum, row) => sum + row.sales, 0);
}

function extractText(response: OpenAIResponse) {
  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();

  return text;
}

async function buildBusinessSummaryData(userId: string) {
  const today = new Date();
  const todayKey = dateKey(today);
  const monthStart = `${todayKey.slice(0, 7)}-01`;
  const previousSevenStart = new Date(today);
  previousSevenStart.setDate(today.getDate() - 13);
  const currentSevenStart = new Date(today);
  currentSevenStart.setDate(today.getDate() - 6);
  const previousSevenEnd = new Date(today);
  previousSevenEnd.setDate(today.getDate() - 7);

  const [business, todayReport, monthReport] = await Promise.all([
    getBusinessProfile(userId),
    getReportsByDateRange(userId, { startDate: todayKey, endDate: todayKey }, { enforcePackage: false }),
    getReportsByDateRange(userId, { startDate: monthStart, endDate: todayKey }, { enforcePackage: false }),
  ]);

  if (!business) throw new AppError("Business profile not found.", 404);

  const dailySales = monthReport.charts.salesVsExpenses.map((row) => ({
    date: row.date,
    sales: row.sales,
  }));
  const currentSevenDaysSales = sumDailySales(
    dailySales,
    dateKey(currentSevenStart),
    todayKey,
  );
  const previousSevenDaysSales = sumDailySales(
    dailySales,
    dateKey(previousSevenStart),
    dateKey(previousSevenEnd),
  );
  const salesTrendPercent =
    previousSevenDaysSales === 0
      ? null
      : Math.round(((currentSevenDaysSales - previousSevenDaysSales) / previousSevenDaysSales) * 100);

  return {
    date: todayKey,
    business: {
      name: business.name,
      currency: business.currency,
      country: business.country,
    },
    today: {
      sales: todayReport.summary.totalSales,
      expenses: todayReport.summary.totalExpenses,
      grossProfit: todayReport.summary.grossProfit,
      estimatedProfit: todayReport.summary.netProfit,
      numberOfSales: todayReport.summary.numberOfSales,
      numberOfExpenses: todayReport.summary.numberOfExpenses,
    },
    month: {
      sales: monthReport.summary.totalSales,
      expenses: monthReport.summary.totalExpenses,
      estimatedProfit: monthReport.summary.netProfit,
      numberOfSales: monthReport.summary.numberOfSales,
      numberOfExpenses: monthReport.summary.numberOfExpenses,
    },
    monthlySalesTrend: {
      direction: trendDirection(currentSevenDaysSales, previousSevenDaysSales),
      currentSevenDaysSales,
      previousSevenDaysSales,
      percentChange: salesTrendPercent,
      dailySales,
    },
    highestSellingProduct: monthReport.productPerformance.bestSellingProducts[0] ?? null,
    highestExpenseCategory: monthReport.charts.expenseByCategory[0] ?? null,
    lowStockWarnings: monthReport.productPerformance.lowStockProducts.slice(0, 5),
  };
}

export async function generateBusinessSummary(userId: string) {
  const businessId = await getDefaultBusinessId(userId);
  await checkPackageFeature(businessId, "allowAiInsights");

  if (!env.openaiApiKey) {
    throw new AppError("OPENAI_API_KEY is not configured on the backend.", 500);
  }

  const summaryData = await buildBusinessSummaryData(userId);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      instructions:
        "You write short business summaries for small business owners. Use simple words, plain numbers, and one paragraph. Mention today's sales, today's expenses, today's estimated profit, monthly sales trend, highest-selling product, highest expense category, low stock warnings, and one practical piece of advice. Do not invent data.",
      input: `Create a simple business summary from this aggregate data only:\n${JSON.stringify(
        summaryData,
      )}`,
      max_output_tokens: 180,
      text: {
        verbosity: "low",
      },
    }),
  });

  const payload = (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    throw new AppError(payload.error?.message ?? "Could not generate AI summary.", 502);
  }

  const summary = extractText(payload);
  if (!summary) throw new AppError("AI summary was empty. Please try again.", 502);

  return {
    summary,
    generatedAt: new Date().toISOString(),
  };
}
