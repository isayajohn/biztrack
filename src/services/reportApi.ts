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
