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

type PublicPackageApiItem = Omit<PublicPackage, "limits" | "features"> & {
  limits?: PublicPackage["limits"];
  features?: PublicPackage["features"];
  maxBusinesses?: number;
  maxUsers?: number;
  maxProducts?: number;
  maxSalesPerMonth?: number;
  maxExpensesPerMonth?: number;
  allowReports?: boolean;
  allowPdfExport?: boolean;
  allowCsvExport?: boolean;
  allowInventoryAlerts?: boolean;
  allowAiInsights?: boolean;
};

type PublicPackagesResponse = PublicPackageApiItem[] | { packages?: PublicPackageApiItem[] };

function normalizePublicPackage(plan: PublicPackageApiItem): PublicPackage {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? null,
    priceMonthly: Number(plan.priceMonthly ?? 0),
    priceYearly: plan.priceYearly == null ? null : Number(plan.priceYearly),
    currency: plan.currency,
    trialDays: Number(plan.trialDays ?? 0),
    sortOrder: Number(plan.sortOrder ?? 0),
    limits: {
      maxBusinesses: Number(plan.limits?.maxBusinesses ?? plan.maxBusinesses ?? 0),
      maxUsers: Number(plan.limits?.maxUsers ?? plan.maxUsers ?? 0),
      maxProducts: Number(plan.limits?.maxProducts ?? plan.maxProducts ?? 0),
      maxSalesPerMonth: Number(plan.limits?.maxSalesPerMonth ?? plan.maxSalesPerMonth ?? 0),
      maxExpensesPerMonth: Number(plan.limits?.maxExpensesPerMonth ?? plan.maxExpensesPerMonth ?? 0),
    },
    features: {
      allowReports: Boolean(plan.features?.allowReports ?? plan.allowReports),
      allowPdfExport: Boolean(plan.features?.allowPdfExport ?? plan.allowPdfExport),
      allowCsvExport: Boolean(plan.features?.allowCsvExport ?? plan.allowCsvExport),
      allowInventoryAlerts: Boolean(plan.features?.allowInventoryAlerts ?? plan.allowInventoryAlerts),
      allowAiInsights: Boolean(plan.features?.allowAiInsights ?? plan.allowAiInsights),
    },
  };
}

function normalizePublicPackages(payload: PublicPackagesResponse): PublicPackage[] {
  const packages = Array.isArray(payload) ? payload : payload.packages;
  return Array.isArray(packages) ? packages.map(normalizePublicPackage) : [];
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
  const payload = unwrap<PublicPackagesResponse>(await apiClient.get("/public/packages"));
  return normalizePublicPackages(payload);
}
