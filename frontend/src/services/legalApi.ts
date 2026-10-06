import { apiClient } from "./apiClient";

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  type: "TERMS" | "PRIVACY";
  title: string;
  version: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
  publishedAt: string;
};

export type LegalDocuments = {
  terms: LegalDocument;
  privacy: LegalDocument;
};

export async function getLegalDocuments(): Promise<LegalDocuments> {
  const response = await apiClient.get<{ data: LegalDocuments }>("/public/legal-documents");
  return response.data.data;
}

export async function getLegalDocument(type: "terms" | "privacy"): Promise<LegalDocument> {
  const response = await apiClient.get<{ data: LegalDocument }>(`/public/legal-documents/${type}`);
  return response.data.data;
}
