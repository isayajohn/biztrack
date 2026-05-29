import { apiClient } from "./apiClient";

export type PublicLandingPageContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  features: Array<Record<string, unknown>>;
  pricing: Array<Record<string, unknown>>;
  faqs: Array<Record<string, unknown>>;
  testimonials?: Array<Record<string, unknown>> | null;
  footerLinks?: Array<Record<string, unknown>> | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type PublicPackage = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly?: number | null;
  currency: string;
  trialDays: number;
  sortOrder: number;
  limits: {
    maxBusinesses: number;
    maxUsers: number;
    maxProducts: number;
    maxSalesPerMonth: number;
    maxExpensesPerMonth: number;
  };
  features: {
    allowReports: boolean;
    allowPdfExport: boolean;
    allowCsvExport: boolean;
    allowInventoryAlerts: boolean;
    allowAiInsights: boolean;
  };
};

export type AppBranding = {
  logoUrl?: string | null;
  logoFileName?: string | null;
  logoMimeType?: string | null;
  updatedAt?: string | null;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

function sanitizeLandingContent(content: PublicLandingPageContent): PublicLandingPageContent {
  return {
    heroTitle: content.heroTitle,
    heroSubtitle: content.heroSubtitle,
    primaryButtonText: content.primaryButtonText,
    primaryButtonUrl: content.primaryButtonUrl,
    secondaryButtonText: content.secondaryButtonText,
    secondaryButtonUrl: content.secondaryButtonUrl,
    features: Array.isArray(content.features) ? content.features : [],
    pricing: Array.isArray(content.pricing) ? content.pricing : [],
    faqs: Array.isArray(content.faqs) ? content.faqs : [],
    testimonials: Array.isArray(content.testimonials) ? content.testimonials : [],
    footerLinks: Array.isArray(content.footerLinks) ? content.footerLinks : [],
    seoTitle: content.seoTitle ?? null,
    seoDescription: content.seoDescription ?? null,
  };
}

export async function getLandingPageContent() {
  const content = unwrap<PublicLandingPageContent>(await apiClient.get("/public/landing-page"));
  return sanitizeLandingContent(content);
}

export async function getPublicBranding() {
  return unwrap<AppBranding>(await apiClient.get("/public/landing-page/branding"));
}

export async function getPublicPackages() {
  return unwrap<PublicPackage[]>(await apiClient.get("/public/packages"));
}
