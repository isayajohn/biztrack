import { apiClient } from "./apiClient";

export type PublicLandingPageContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroKicker?: string | null;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  heroTrustText?: string | null;
  heroImageUrl?: string | null;
  featuresEyebrow?: string | null;
  featuresTitle?: string | null;
  featuresDescription?: string | null;
  pricingEyebrow?: string | null;
  pricingTitle?: string | null;
  pricingDescription?: string | null;
  testimonialsEyebrow?: string | null;
  testimonialsTitle?: string | null;
  testimonialsDescription?: string | null;
  faqEyebrow?: string | null;
  faqTitle?: string | null;
  faqDescription?: string | null;
  finalCtaKicker?: string | null;
  finalCtaTitle?: string | null;
  finalCtaDescription?: string | null;
  features: Array<Record<string, unknown>>;
  pricing: Array<Record<string, unknown>>;
  faqs: Array<Record<string, unknown>>;
  testimonials?: Array<Record<string, unknown>> | null;
  footerLinks?: Array<Record<string, unknown>> | null;
  heroTrustIndicators?: Array<Record<string, unknown>> | null;
  footerTagline?: string | null;
  footerBadge?: string | null;
  footerProductLinks?: Array<Record<string, unknown>> | null;
  footerCompanyLinks?: Array<Record<string, unknown>> | null;
  problemSection?: Record<string, unknown> | null;
  solutionSection?: Record<string, unknown> | null;
  howItWorks?: Record<string, unknown> | null;
  mobileAppTitle?: string | null;
  mobileAppDescription?: string | null;
  androidAppUrl?: string | null;
  iosAppUrl?: string | null;
  apkAvailable?: boolean;
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
type PublicLandingPageApiContent = Partial<PublicLandingPageContent> & {
  hero_title?: string;
  hero_subtitle?: string;
  hero_kicker?: string | null;
  primary_button_text?: string;
  primary_button_url?: string;
  secondary_button_text?: string;
  secondary_button_url?: string;
  hero_trust_text?: string | null;
  hero_image_url?: string | null;
  features_eyebrow?: string | null;
  features_title?: string | null;
  features_description?: string | null;
  pricing_eyebrow?: string | null;
  pricing_title?: string | null;
  pricing_description?: string | null;
  testimonials_eyebrow?: string | null;
  testimonials_title?: string | null;
  testimonials_description?: string | null;
  faq_eyebrow?: string | null;
  faq_title?: string | null;
  faq_description?: string | null;
  final_cta_kicker?: string | null;
  final_cta_title?: string | null;
  final_cta_description?: string | null;
  footer_links?: Array<Record<string, unknown>> | null;
  hero_trust_indicators?: Array<Record<string, unknown>> | null;
  footer_tagline?: string | null;
  footer_badge?: string | null;
  footer_product_links?: Array<Record<string, unknown>> | null;
  footer_company_links?: Array<Record<string, unknown>> | null;
  problem_section?: Record<string, unknown> | null;
  solution_section?: Record<string, unknown> | null;
  how_it_works?: Record<string, unknown> | null;
  mobile_app_title?: string | null;
  mobile_app_description?: string | null;
  android_app_url?: string | null;
  ios_app_url?: string | null;
  apk_available?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
};

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

function sanitizeLandingContent(content: PublicLandingPageApiContent | null): PublicLandingPageContent {
  return {
    heroTitle: content?.heroTitle ?? content?.hero_title ?? "",
    heroSubtitle: content?.heroSubtitle ?? content?.hero_subtitle ?? "",
    heroKicker: content?.heroKicker ?? content?.hero_kicker ?? null,
    primaryButtonText: content?.primaryButtonText ?? content?.primary_button_text ?? "Get Started Free",
    primaryButtonUrl: content?.primaryButtonUrl ?? content?.primary_button_url ?? "/register",
    secondaryButtonText: content?.secondaryButtonText ?? content?.secondary_button_text ?? "View Demo",
    secondaryButtonUrl: content?.secondaryButtonUrl ?? content?.secondary_button_url ?? "#dashboard-preview",
    heroTrustText: content?.heroTrustText ?? content?.hero_trust_text ?? null,
    heroImageUrl: content?.heroImageUrl ?? content?.hero_image_url ?? null,
    featuresEyebrow: content?.featuresEyebrow ?? content?.features_eyebrow ?? null,
    featuresTitle: content?.featuresTitle ?? content?.features_title ?? null,
    featuresDescription: content?.featuresDescription ?? content?.features_description ?? null,
    pricingEyebrow: content?.pricingEyebrow ?? content?.pricing_eyebrow ?? null,
    pricingTitle: content?.pricingTitle ?? content?.pricing_title ?? null,
    pricingDescription: content?.pricingDescription ?? content?.pricing_description ?? null,
    testimonialsEyebrow: content?.testimonialsEyebrow ?? content?.testimonials_eyebrow ?? null,
    testimonialsTitle: content?.testimonialsTitle ?? content?.testimonials_title ?? null,
    testimonialsDescription: content?.testimonialsDescription ?? content?.testimonials_description ?? null,
    faqEyebrow: content?.faqEyebrow ?? content?.faq_eyebrow ?? null,
    faqTitle: content?.faqTitle ?? content?.faq_title ?? null,
    faqDescription: content?.faqDescription ?? content?.faq_description ?? null,
    finalCtaKicker: content?.finalCtaKicker ?? content?.final_cta_kicker ?? null,
    finalCtaTitle: content?.finalCtaTitle ?? content?.final_cta_title ?? null,
    finalCtaDescription: content?.finalCtaDescription ?? content?.final_cta_description ?? null,
    features: Array.isArray(content?.features) ? content.features : [],
    pricing: Array.isArray(content?.pricing) ? content.pricing : [],
    faqs: Array.isArray(content?.faqs) ? content.faqs : [],
    testimonials: Array.isArray(content?.testimonials) ? content.testimonials : [],
    footerLinks: Array.isArray(content?.footerLinks) ? content.footerLinks : Array.isArray(content?.footer_links) ? content.footer_links : [],
    heroTrustIndicators: Array.isArray(content?.heroTrustIndicators) ? content.heroTrustIndicators : Array.isArray(content?.hero_trust_indicators) ? content.hero_trust_indicators : [],
    footerTagline: content?.footerTagline ?? content?.footer_tagline ?? null,
    footerBadge: content?.footerBadge ?? content?.footer_badge ?? null,
    footerProductLinks: Array.isArray(content?.footerProductLinks) ? content.footerProductLinks : Array.isArray(content?.footer_product_links) ? content.footer_product_links : [],
    footerCompanyLinks: Array.isArray(content?.footerCompanyLinks) ? content.footerCompanyLinks : Array.isArray(content?.footer_company_links) ? content.footer_company_links : [],
    problemSection: content?.problemSection ?? content?.problem_section ?? null,
    solutionSection: content?.solutionSection ?? content?.solution_section ?? null,
    howItWorks: content?.howItWorks ?? content?.how_it_works ?? null,
    mobileAppTitle: content?.mobileAppTitle ?? content?.mobile_app_title ?? null,
    mobileAppDescription: content?.mobileAppDescription ?? content?.mobile_app_description ?? null,
    androidAppUrl: content?.androidAppUrl ?? content?.android_app_url ?? null,
    iosAppUrl: content?.iosAppUrl ?? content?.ios_app_url ?? null,
    apkAvailable: Boolean(content?.apkAvailable ?? content?.apk_available),
    seoTitle: content?.seoTitle ?? content?.seo_title ?? null,
    seoDescription: content?.seoDescription ?? content?.seo_description ?? null,
  };
}

export async function getLandingPageContent() {
  const content = unwrap<PublicLandingPageApiContent | null>(await apiClient.get("/public/landing-page"));
  return sanitizeLandingContent(content);
}

export async function getPublicBranding() {
  return unwrap<AppBranding>(await apiClient.get("/public/landing-page/branding"));
}

export async function getPublicPackages() {
  const payload = unwrap<PublicPackagesResponse>(await apiClient.get("/public/packages"));
  return normalizePublicPackages(payload);
}
