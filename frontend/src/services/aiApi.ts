import { apiClient } from "./apiClient";

export type BusinessSummaryResponse = {
  summary: string;
  generatedAt: string;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function generateBusinessSummary(): Promise<BusinessSummaryResponse> {
  return unwrap<BusinessSummaryResponse>(await apiClient.post("/ai/business-summary"));
}
