import { apiClient } from "./apiClient";
import type { ReportData } from "../utils/reportUtils";

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getDashboardReport() {
  return unwrap(await apiClient.get("/dashboard"));
}

export async function getReportsByDateRange(
  startDate: string,
  endDate: string,
): Promise<ReportData> {
  return unwrap<ReportData>(
    await apiClient.get("/reports", {
      params: { startDate, endDate },
    }),
  );
}

export type CashFlowTransaction = { date: string; type: string; description: string; method: string; inflow: number; outflow: number };
export type CashFlowReport = { period: { startDate: string; endDate: string }; summary: { totalInflow: number; totalOutflow: number; netCashFlow: number }; daily: Array<{ date: string; inflow: number; outflow: number; net: number }>; transactions: CashFlowTransaction[] };
export type PurchaseReportRow = { id: string; orderNumber: string; supplier: string | null; status: string; totalAmount: number; paidAmount: number; outstanding: number; items: number; createdAt: string };
export type PurchaseReport = { period: { startDate: string; endDate: string }; summary: { totalPurchases: number; paid: number; outstanding: number; orders: number }; bySupplier: Array<{ name: string; orders: number; total: number; paid: number }>; byStatus: Array<{ status: string; orders: number; total: number }>; purchases: PurchaseReportRow[] };

export async function getCashFlowReport(startDate: string, endDate: string): Promise<CashFlowReport> { return unwrap<CashFlowReport>(await apiClient.get("/reports/cash-flow", { params: { startDate, endDate } })); }
export async function getPurchaseReport(startDate: string, endDate: string): Promise<PurchaseReport> { return unwrap<PurchaseReport>(await apiClient.get("/reports/purchases", { params: { startDate, endDate } })); }
