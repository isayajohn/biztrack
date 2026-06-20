import { apiClient } from "./apiClient";
import type { AppBranding } from "./landingApi";

export type AdminRole = "USER" | "SUPER_ADMIN";
export type AdminStatus = "ACTIVE" | "SUSPENDED";
export type PackageStatus = "ACTIVE" | "INACTIVE";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
export type BillingCycle = "MONTHLY" | "YEARLY" | "LIFETIME" | "MANUAL";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type ConfigProvider = "SMTP" | "API" | "CUSTOM";
export type TemplateType = "EMAIL" | "SMS";
export type TemplateKey =
  | "EMAIL_VERIFICATION"
  | "PASSWORD_RESET"
  | "LOGIN_ALERT"
  | "OTP_CODE"
  | "ACCOUNT_SUSPENDED"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_EXPIRED";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt?: string | null;
  businessCount?: number;
  businesses?: Array<{
    id: string;
    name: string;
    country: string;
    currency: string;
    createdAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminBusiness = {
  id: string;
  name: string;
  country: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<AdminUser, "id" | "name" | "email" | "role" | "status">;
  _count: {
    products: number;
    sales: number;
    expenses: number;
  };
  totalSalesAmount: number;
  totalExpensesAmount: number;
};

export type AdminBusinessDetails = AdminBusiness & {
  recentSales: Array<{
    id: string;
    saleDate: string;
    productName: string | null;
    quantity: number;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
  }>;
  recentExpenses: Array<{
    id: string;
    expenseDate: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
  }>;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type PlatformStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalBusinesses: number;
  totalSalesAmount: number;
  totalExpensesAmount: number;
  totalProducts: number;
  recentUsers: AdminUser[];
  recentBusinesses: AdminBusiness[];
};

export type SystemSummary = {
  salesByDay: Array<{ date: string; total: number; count: number }>;
  expensesByCategory: Array<{ category: string; total: number; count: number }>;
};

export type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  targetUserId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; name: string; email: string } | null;
};

export type AdminPackage = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly?: number | null;
  currency: string;
  trialDays: number;
  maxBusinesses: number;
  maxUsers: number;
  maxProducts: number;
  maxSalesPerMonth: number;
  maxExpensesPerMonth: number;
  allowReports: boolean;
  allowPdfExport: boolean;
  allowCsvExport: boolean;
  allowInventoryAlerts: boolean;
  allowAiInsights: boolean;
  status: PackageStatus;
  sortOrder: number;
  subscriptionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PackagePayload = Omit<
  AdminPackage,
  "id" | "slug" | "subscriptionCount" | "createdAt" | "updatedAt"
> & {
  slug?: string;
};

export type AdminSubscription = {
  id: string;
  businessId: string;
  packageId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startsAt: string;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  notes?: string | null;
  business: Pick<AdminBusiness, "id" | "name" | "currency" | "country"> & {
    user: Pick<AdminUser, "id" | "name" | "email">;
  };
  package: AdminPackage | (Pick<
    AdminPackage,
    "id" | "name" | "slug" | "description" | "priceMonthly" | "priceYearly" | "currency" | "trialDays" | "status" | "sortOrder" | "createdAt" | "updatedAt"
  > & {
    limits?: Pick<
      AdminPackage,
      | "maxBusinesses"
      | "maxUsers"
      | "maxProducts"
      | "maxSalesPerMonth"
      | "maxExpensesPerMonth"
      | "allowReports"
      | "allowPdfExport"
      | "allowCsvExport"
      | "allowInventoryAlerts"
      | "allowAiInsights"
    >;
  });
  packageLimits?: Pick<
    AdminPackage,
    | "maxBusinesses"
    | "maxUsers"
    | "maxProducts"
    | "maxSalesPerMonth"
    | "maxExpensesPerMonth"
    | "allowReports"
    | "allowPdfExport"
    | "allowCsvExport"
    | "allowInventoryAlerts"
    | "allowAiInsights"
  >;
  createdAt: string;
  updatedAt: string;
};

export type AdminCollection = {
  id: string;
  businessId: string;
  packageId: string;
  subscriptionId?: string | null;
  status: PaymentStatus;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  provider: string;
  externalId: string;
  providerReference?: string | null;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  business: Pick<AdminBusiness, "id" | "name" | "currency" | "country"> & {
    user: Pick<AdminUser, "id" | "name" | "email">;
  };
  package: Pick<AdminPackage, "id" | "name" | "slug" | "currency" | "priceMonthly" | "priceYearly">;
  createdAt: string;
  updatedAt: string;
};

export type AdminCollectionStats = {
  totalCount: number;
  totalAmount: number;
  byStatus: Partial<Record<PaymentStatus, { count: number; amount: number }>>;
  latest: AdminCollection[];
};

export type LandingPageContent = {
  id?: string | null;
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
  isPublished: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MessageTemplate = {
  id: string;
  type: TemplateType;
  key: TemplateKey;
  subject?: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ManagedEmailTemplate = {
  key: TemplateKey;
  subject?: string | null;
  body: string;
  isActive: boolean;
  requiredVariables?: string[];
  supportedVariables?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ManagedSmsTemplate = {
  key: Extract<TemplateKey, "OTP_CODE" | "ACCOUNT_SUSPENDED" | "SUBSCRIPTION_ACTIVATED" | "SUBSCRIPTION_EXPIRED">;
  body: string;
  isActive: boolean;
  requiredVariables?: string[];
  supportedVariables?: string[];
  createdAt: string;
  updatedAt: string;
};

export type EmailTemplatePreview = {
  key: TemplateKey;
  subject: string | null;
  body: string | null;
  variables: Record<string, string>;
};

export type SmsTemplatePreview = {
  key: ManagedSmsTemplate["key"];
  body: string;
  characterCount: number;
  variables: Record<string, string>;
};

export type EmailConfig = {
  id: string;
  provider: ConfigProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  passwordMasked?: string | null;
  apiKeyMasked?: string | null;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmailSettings = {
  config: EmailConfig | null;
  templates: MessageTemplate[];
};

export type SmsConfig = {
  id: string;
  provider: ConfigProvider;
  baseUrl?: string | null;
  apiKeyMasked?: string | null;
  apiSecretMasked?: string | null;
  senderId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SmsSettings = {
  config: SmsConfig | null;
  templates: MessageTemplate[];
};

export type EmailTestResult = {
  status: "SENT";
  provider: ConfigProvider;
  fromEmail: string;
  toMasked: string | null;
};

export type SmsTestResult = {
  status: "SENT";
  provider: ConfigProvider;
  senderId?: string | null;
  phoneNumberMasked: string | null;
};

export type SecurityConfig = {
  id: string;
  requireEmailVerification: boolean;
  enablePasswordReset: boolean;
  enableOtpLogin: boolean;
  enableSmsOtp: boolean;
  passwordMinLength: number;
  passwordRequireNumber: boolean;
  passwordRequireSpecialChar: boolean;
  otpExpiryMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  sessionExpiryMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogsQuery = {
  action?: string;
  actor?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

function numberOrZero(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizePagination<T>(payload: {
  total?: number;
  page?: number;
  limit?: number;
}, fallbackLimit = 20): PaginationMeta {
  const page = Math.max(1, numberOrZero(payload.page) || 1);
  const limit = Math.max(1, numberOrZero(payload.limit) || fallbackLimit);
  const total = Math.max(0, numberOrZero(payload.total));
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function normalizePaginated<T>(
  payload: { total?: number; page?: number; limit?: number } & Record<string, unknown>,
  key: string,
): PaginatedResult<T> {
  const items = payload[key];
  return {
    items: Array.isArray(items) ? (items as T[]) : [],
    pagination: normalizePagination(payload),
  };
}

type PlatformStatsResponse = Partial<PlatformStats> & {
  activeSubscriptions?: number;
};

type ApiEmailConfig = Partial<EmailConfig> & {
  from_name?: string;
  from_email?: string;
  reply_to_email?: string | null;
  password_encrypted?: string | null;
  api_key_encrypted?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type ApiMessageTemplate = Partial<MessageTemplate> & {
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type ApiAppBranding = Partial<AppBranding> & {
  logo_data_url?: string | null;
  logo_file_name?: string | null;
  logo_mime_type?: string | null;
  updated_at?: string | null;
};

type ApiLandingPageContent = Partial<LandingPageContent> & {
  hero_title?: string;
  hero_subtitle?: string;
  primary_button_text?: string;
  primary_button_url?: string;
  secondary_button_text?: string;
  secondary_button_url?: string;
  footer_links?: Array<Record<string, unknown>> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  is_published?: boolean | number;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiSmsConfig = Partial<SmsConfig> & {
  base_url?: string | null;
  api_key_encrypted?: string | null;
  api_secret_encrypted?: string | null;
  sender_id?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type ApiSecurityConfig = Partial<SecurityConfig> & {
  require_email_verification?: boolean | number;
  enable_password_reset?: boolean | number;
  enable_otp_login?: boolean | number;
  enable_sms_otp?: boolean | number;
  password_min_length?: number;
  password_require_number?: boolean | number;
  password_require_special_char?: boolean | number;
  otp_expiry_minutes?: number;
  max_login_attempts?: number;
  lockout_minutes?: number;
  session_expiry_minutes?: number;
  created_at?: string;
  updated_at?: string;
};

const emptyLandingContent: LandingPageContent = {
  id: null,
  heroTitle: "",
  heroSubtitle: "",
  primaryButtonText: "Get Started Free",
  primaryButtonUrl: "/register",
  secondaryButtonText: "View Demo",
  secondaryButtonUrl: "/demo",
  features: [],
  pricing: [],
  faqs: [],
  testimonials: [],
  footerLinks: [],
  seoTitle: "",
  seoDescription: "",
  isPublished: false,
  createdAt: null,
  updatedAt: null,
};

const defaultSecurityConfig: SecurityConfig = {
  id: "",
  requireEmailVerification: true,
  enablePasswordReset: true,
  enableOtpLogin: false,
  enableSmsOtp: false,
  passwordMinLength: 8,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  otpExpiryMinutes: 10,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  sessionExpiryMinutes: 1440,
  createdAt: "",
  updatedAt: "",
};

function normalizePlatformStats(stats: PlatformStatsResponse): PlatformStats {
  return {
    totalUsers: numberOrZero(stats.totalUsers),
    activeUsers: numberOrZero(stats.activeUsers),
    suspendedUsers: numberOrZero(stats.suspendedUsers),
    totalBusinesses: numberOrZero(stats.totalBusinesses),
    totalSalesAmount: numberOrZero(stats.totalSalesAmount),
    totalExpensesAmount: numberOrZero(stats.totalExpensesAmount),
    totalProducts: numberOrZero(stats.totalProducts),
    recentUsers: Array.isArray(stats.recentUsers) ? stats.recentUsers : [],
    recentBusinesses: Array.isArray(stats.recentBusinesses) ? stats.recentBusinesses : [],
  };
}

function normalizeBranding(branding: ApiAppBranding | null): AppBranding {
  return {
    logoUrl: branding?.logoUrl ?? branding?.logo_data_url ?? null,
    logoFileName: branding?.logoFileName ?? branding?.logo_file_name ?? null,
    logoMimeType: branding?.logoMimeType ?? branding?.logo_mime_type ?? null,
    updatedAt: branding?.updatedAt ?? branding?.updated_at ?? null,
  };
}

function normalizeLandingContent(content: ApiLandingPageContent | null): LandingPageContent {
  if (!content) return { ...emptyLandingContent };

  return {
    id: content.id ?? null,
    heroTitle: content.heroTitle ?? content.hero_title ?? "",
    heroSubtitle: content.heroSubtitle ?? content.hero_subtitle ?? "",
    primaryButtonText: content.primaryButtonText ?? content.primary_button_text ?? "Get Started Free",
    primaryButtonUrl: content.primaryButtonUrl ?? content.primary_button_url ?? "/register",
    secondaryButtonText: content.secondaryButtonText ?? content.secondary_button_text ?? "View Demo",
    secondaryButtonUrl: content.secondaryButtonUrl ?? content.secondary_button_url ?? "/demo",
    features: Array.isArray(content.features) ? content.features : [],
    pricing: Array.isArray(content.pricing) ? content.pricing : [],
    faqs: Array.isArray(content.faqs) ? content.faqs : [],
    testimonials: Array.isArray(content.testimonials) ? content.testimonials : [],
    footerLinks: Array.isArray(content.footerLinks) ? content.footerLinks : Array.isArray(content.footer_links) ? content.footer_links : [],
    seoTitle: content.seoTitle ?? content.seo_title ?? "",
    seoDescription: content.seoDescription ?? content.seo_description ?? "",
    isPublished: Boolean(content.isPublished ?? content.is_published),
    createdAt: content.createdAt ?? content.created_at ?? null,
    updatedAt: content.updatedAt ?? content.updated_at ?? null,
  };
}

function normalizeEmailConfig(config: ApiEmailConfig | null): EmailConfig | null {
  if (!config) return null;

  return {
    id: config.id ?? "",
    provider: config.provider ?? "SMTP",
    host: config.host ?? null,
    port: config.port == null ? null : Number(config.port),
    username: config.username ?? null,
    passwordMasked: config.passwordMasked ?? (config.password_encrypted ? "********" : null),
    apiKeyMasked: config.apiKeyMasked ?? (config.api_key_encrypted ? "********" : null),
    fromName: config.fromName ?? config.from_name ?? "BizTrack",
    fromEmail: config.fromEmail ?? config.from_email ?? "",
    replyToEmail: config.replyToEmail ?? config.reply_to_email ?? null,
    isActive: Boolean(config.isActive ?? config.is_active),
    createdAt: config.createdAt ?? config.created_at ?? "",
    updatedAt: config.updatedAt ?? config.updated_at ?? "",
  };
}

function normalizeMessageTemplate(template: ApiMessageTemplate): MessageTemplate {
  return {
    id: template.id ?? "",
    type: template.type ?? "EMAIL",
    key: template.key ?? "EMAIL_VERIFICATION",
    subject: template.subject ?? null,
    body: template.body ?? "",
    isActive: Boolean(template.isActive ?? template.is_active),
    createdAt: template.createdAt ?? template.created_at ?? "",
    updatedAt: template.updatedAt ?? template.updated_at ?? "",
  };
}

function normalizeSmsConfig(config: ApiSmsConfig | null): SmsConfig | null {
  if (!config) return null;

  return {
    id: config.id ?? "",
    provider: config.provider ?? "API",
    baseUrl: config.baseUrl ?? config.base_url ?? null,
    apiKeyMasked: config.apiKeyMasked ?? (config.api_key_encrypted ? "********" : null),
    apiSecretMasked: config.apiSecretMasked ?? (config.api_secret_encrypted ? "********" : null),
    senderId: config.senderId ?? config.sender_id ?? null,
    isActive: Boolean(config.isActive ?? config.is_active ?? true),
    createdAt: config.createdAt ?? config.created_at ?? "",
    updatedAt: config.updatedAt ?? config.updated_at ?? "",
  };
}

function normalizeSecurityConfig(config: ApiSecurityConfig | null): SecurityConfig {
  if (!config) return { ...defaultSecurityConfig };

  return {
    id: config.id ?? "",
    requireEmailVerification: Boolean(config.requireEmailVerification ?? config.require_email_verification ?? defaultSecurityConfig.requireEmailVerification),
    enablePasswordReset: Boolean(config.enablePasswordReset ?? config.enable_password_reset ?? defaultSecurityConfig.enablePasswordReset),
    enableOtpLogin: Boolean(config.enableOtpLogin ?? config.enable_otp_login ?? defaultSecurityConfig.enableOtpLogin),
    enableSmsOtp: Boolean(config.enableSmsOtp ?? config.enable_sms_otp ?? defaultSecurityConfig.enableSmsOtp),
    passwordMinLength: numberOrZero(config.passwordMinLength ?? config.password_min_length) || defaultSecurityConfig.passwordMinLength,
    passwordRequireNumber: Boolean(config.passwordRequireNumber ?? config.password_require_number ?? defaultSecurityConfig.passwordRequireNumber),
    passwordRequireSpecialChar: Boolean(config.passwordRequireSpecialChar ?? config.password_require_special_char ?? defaultSecurityConfig.passwordRequireSpecialChar),
    otpExpiryMinutes: numberOrZero(config.otpExpiryMinutes ?? config.otp_expiry_minutes) || defaultSecurityConfig.otpExpiryMinutes,
    maxLoginAttempts: numberOrZero(config.maxLoginAttempts ?? config.max_login_attempts) || defaultSecurityConfig.maxLoginAttempts,
    lockoutMinutes: numberOrZero(config.lockoutMinutes ?? config.lockout_minutes) || defaultSecurityConfig.lockoutMinutes,
    sessionExpiryMinutes: numberOrZero(config.sessionExpiryMinutes ?? config.session_expiry_minutes) || defaultSecurityConfig.sessionExpiryMinutes,
    createdAt: config.createdAt ?? config.created_at ?? "",
    updatedAt: config.updatedAt ?? config.updated_at ?? "",
  };
}

export async function getAdminStats() {
  return normalizePlatformStats(unwrap<PlatformStatsResponse>(await apiClient.get("/admin/stats")));
}

export async function getSystemSummary() {
  return unwrap<SystemSummary>(await apiClient.get("/admin/summary"));
}

export async function getAdminBranding() {
  return normalizeBranding(unwrap<ApiAppBranding | null>(await apiClient.get("/admin/branding")));
}

export async function updateAdminBranding(payload: {
  logoDataUrl: string;
  logoFileName?: string | null;
  logoMimeType?: string | null;
}) {
  return normalizeBranding(unwrap<ApiAppBranding>(await apiClient.put("/admin/branding", payload)));
}

export async function removeAdminBrandingLogo() {
  return normalizeBranding(unwrap<ApiAppBranding | null>(await apiClient.delete("/admin/branding/logo")));
}

export async function getAdminUsers(search = "") {
  const result = await getAdminUsersPage({ search, limit: 100 });
  return result.items;
}

export async function getAdminUser(id: string) {
  return unwrap<AdminUser>(await apiClient.get(`/admin/users/${id}`));
}

export async function updateAdminUserStatus(id: string, status: AdminStatus) {
  return unwrap<AdminUser>(await apiClient.patch(`/admin/users/${id}/status`, { status }));
}

export async function updateAdminUserRole(id: string, role: AdminRole) {
  return unwrap<AdminUser>(await apiClient.patch(`/admin/users/${id}/role`, { role }));
}

export async function deleteAdminUser(id: string) {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function getAdminUsersPage(params: {
  search?: string;
  role?: AdminRole;
  status?: AdminStatus;
  page?: number;
  limit?: number;
} = {}) {
  const payload = unwrap<Record<string, unknown> & { total?: number; page?: number; limit?: number }>(
    await apiClient.get("/admin/users", { params }),
  );
  return normalizePaginated<AdminUser>(payload, "users");
}

export async function getAdminBusinessesPage(params: {
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
} = {}) {
  const payload = unwrap<Record<string, unknown> & { total?: number; page?: number; limit?: number }>(
    await apiClient.get("/admin/businesses", { params }),
  );
  return normalizePaginated<AdminBusiness>(payload, "businesses");
}

export async function getAdminBusinesses() {
  const result = await getAdminBusinessesPage({ limit: 100 });
  return result.items;
}

export async function getAdminBusiness(id: string) {
  return unwrap<AdminBusinessDetails>(await apiClient.get(`/admin/businesses/${id}`));
}

export async function getAuditLogs(params: AuditLogsQuery = {}) {
  const payload = unwrap<Record<string, unknown> & { total?: number; page?: number; limit?: number }>(
    await apiClient.get("/admin/audit-logs", { params }),
  );
  return normalizePaginated<AuditLog>(payload, "logs");
}

export async function getAdminPackages() {
  const payload = unwrap<AdminPackage[] | { packages?: AdminPackage[] }>(await apiClient.get("/admin/packages"));
  return Array.isArray(payload) ? payload : payload.packages ?? [];
}

export async function getAdminPackage(id: string) {
  return unwrap<AdminPackage>(await apiClient.get(`/admin/packages/${id}`));
}

export async function createAdminPackage(payload: PackagePayload) {
  return unwrap<AdminPackage>(await apiClient.post("/admin/packages", payload));
}

export async function updateAdminPackage(id: string, payload: Partial<PackagePayload>) {
  return unwrap<AdminPackage>(await apiClient.put(`/admin/packages/${id}`, payload));
}

export async function updateAdminPackageStatus(id: string, status: PackageStatus) {
  return unwrap<AdminPackage>(await apiClient.patch(`/admin/packages/${id}/status`, { status }));
}

export async function deleteAdminPackage(id: string) {
  await apiClient.delete(`/admin/packages/${id}`);
}

export async function getAdminSubscriptions(params: {
  search?: string;
  businessId?: string;
  packageId?: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  page?: number;
  limit?: number;
} = {}) {
  const payload = unwrap<Record<string, unknown> & { total?: number; page?: number; limit?: number }>(
    await apiClient.get("/admin/subscriptions", { params }),
  );
  return normalizePaginated<AdminSubscription>(payload, "subscriptions");
}

export async function assignAdminSubscription(payload: {
  businessId: string;
  packageId: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  startsAt?: string;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  notes?: string | null;
}) {
  return unwrap<AdminSubscription>(await apiClient.post("/admin/subscriptions", payload));
}

export async function changeBusinessPackage(businessId: string, payload: {
  packageId: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  startsAt?: string;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  notes?: string | null;
}) {
  return unwrap<AdminSubscription>(await apiClient.patch(`/admin/businesses/${businessId}/package`, payload));
}

export async function updateAdminSubscriptionStatus(id: string, status: SubscriptionStatus) {
  return unwrap<AdminSubscription>(await apiClient.patch(`/admin/subscriptions/${id}/status`, { status }));
}

export async function extendAdminSubscription(id: string, payload: { endsAt: string; notes?: string | null }) {
  return unwrap<AdminSubscription>(await apiClient.patch(`/admin/subscriptions/${id}/extend`, payload));
}

export async function getAdminCollections(params: {
  search?: string;
  status?: PaymentStatus;
  businessId?: string;
  packageId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const payload = unwrap<Record<string, unknown> & { total?: number; page?: number; limit?: number }>(
    await apiClient.get("/admin/collections", { params }),
  );
  return normalizePaginated<AdminCollection>(payload, "transactions");
}

export async function getAdminCollectionStats() {
  return unwrap<AdminCollectionStats>(await apiClient.get("/admin/collections/stats"));
}

export async function getAdminLandingContent() {
  return normalizeLandingContent(unwrap<ApiLandingPageContent | null>(await apiClient.get("/admin/landing-page")));
}

export async function updateAdminLandingContent(payload: LandingPageContent) {
  return normalizeLandingContent(unwrap<ApiLandingPageContent>(await apiClient.put("/admin/landing-page", payload)));
}

export async function publishAdminLandingContent() {
  return normalizeLandingContent(unwrap<ApiLandingPageContent>(await apiClient.post("/admin/landing-page/publish")));
}

export async function getEmailSettings() {
  const payload = unwrap<{ config: ApiEmailConfig | null; templates?: ApiMessageTemplate[] }>(
    await apiClient.get("/admin/email"),
  );
  return {
    config: normalizeEmailConfig(payload.config),
    templates: Array.isArray(payload.templates) ? payload.templates.map(normalizeMessageTemplate) : [],
  };
}

export async function getEmailConfig() {
  return normalizeEmailConfig(unwrap<ApiEmailConfig | null>(await apiClient.get("/admin/config/email")));
}

export async function updateEmailProviderConfig(payload: {
  provider: ConfigProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  apiKey?: string | null;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  isActive: boolean;
}) {
  return normalizeEmailConfig(unwrap<ApiEmailConfig>(await apiClient.put("/admin/config/email", payload)))!;
}

export async function sendTestEmail(payload: { to: string }) {
  return unwrap<EmailTestResult>(await apiClient.post("/admin/config/email/test", { toEmail: payload.to }));
}

export async function updateEmailConfig(payload: {
  provider: ConfigProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  apiKey?: string | null;
  clearPassword?: boolean;
  clearApiKey?: boolean;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  isActive: boolean;
}) {
  return normalizeEmailConfig(unwrap<ApiEmailConfig>(await apiClient.put("/admin/email/config", payload)))!;
}

export async function updateEmailTemplate(key: TemplateKey, payload: {
  subject?: string | null;
  body: string;
  isActive: boolean;
}) {
  return normalizeMessageTemplate(unwrap<ApiMessageTemplate>(await apiClient.put(`/admin/email/templates/${key}`, payload)));
}

export async function getEmailTemplates() {
  const payload = unwrap<ApiMessageTemplate[] | { templates?: ApiMessageTemplate[] }>(await apiClient.get("/admin/templates/email"));
  const templates = Array.isArray(payload) ? payload : payload.templates;
  return Array.isArray(templates) ? templates.map(normalizeMessageTemplate) as ManagedEmailTemplate[] : [];
}

export async function getEmailTemplate(key: TemplateKey) {
  return normalizeMessageTemplate(unwrap<ApiMessageTemplate>(await apiClient.get(`/admin/templates/email/${key}`))) as ManagedEmailTemplate;
}

export async function updateManagedEmailTemplate(key: TemplateKey, payload: {
  subject: string;
  body: string;
  isActive: boolean;
}) {
  return normalizeMessageTemplate(unwrap<ApiMessageTemplate>(await apiClient.put(`/admin/templates/email/${key}`, payload))) as ManagedEmailTemplate;
}

export async function previewEmailTemplate(key: TemplateKey, variables: Record<string, string> = {}) {
  return unwrap<EmailTemplatePreview>(
    await apiClient.post(`/admin/templates/email/${key}/preview`, { variables }),
  );
}

export async function getSmsSettings() {
  const payload = unwrap<{ config: ApiSmsConfig | null; templates?: ApiMessageTemplate[] }>(
    await apiClient.get("/admin/sms"),
  );
  return {
    config: normalizeSmsConfig(payload.config),
    templates: Array.isArray(payload.templates) ? payload.templates.map(normalizeMessageTemplate) : [],
  };
}

export async function getSmsConfig() {
  return normalizeSmsConfig(unwrap<ApiSmsConfig | null>(await apiClient.get("/admin/config/sms")));
}

export async function updateSmsProviderConfig(payload: {
  provider: ConfigProvider;
  baseUrl?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  senderId?: string | null;
  isActive: boolean;
}) {
  return normalizeSmsConfig(unwrap<ApiSmsConfig>(await apiClient.put("/admin/config/sms", payload)))!;
}

export async function sendConfigTestSms(payload: { phoneNumber: string; message: string }) {
  return unwrap<SmsTestResult>(await apiClient.post("/admin/config/sms/test", payload));
}

export async function updateSmsConfig(payload: {
  provider: ConfigProvider;
  baseUrl?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  clearApiKey?: boolean;
  clearApiSecret?: boolean;
  senderId?: string | null;
  isActive: boolean;
}) {
  return normalizeSmsConfig(unwrap<ApiSmsConfig>(await apiClient.put("/admin/sms/config", payload)))!;
}

export async function updateSmsTemplate(key: TemplateKey, payload: {
  subject?: string | null;
  body: string;
  isActive: boolean;
}) {
  return normalizeMessageTemplate(unwrap<ApiMessageTemplate>(await apiClient.put(`/admin/sms/templates/${key}`, payload)));
}

export async function sendTestSms(payload: { to: string; message: string }) {
  return unwrap<{
    status: "SIMULATED";
    toMasked: string | null;
    provider: ConfigProvider;
    senderId?: string | null;
    messageLength: number;
  }>(await apiClient.post("/admin/sms/test", payload));
}

export async function getSmsTemplates() {
  const payload = unwrap<ApiMessageTemplate[] | { templates?: ApiMessageTemplate[] }>(await apiClient.get("/admin/templates/sms"));
  const templates = Array.isArray(payload) ? payload : payload.templates;
  return Array.isArray(templates) ? templates.map(normalizeMessageTemplate) as ManagedSmsTemplate[] : [];
}

export async function getSmsTemplate(key: ManagedSmsTemplate["key"]) {
  return normalizeMessageTemplate(unwrap<ApiMessageTemplate>(await apiClient.get(`/admin/templates/sms/${key}`))) as ManagedSmsTemplate;
}

export async function updateManagedSmsTemplate(key: ManagedSmsTemplate["key"], payload: {
  body: string;
  isActive: boolean;
}) {
  return normalizeMessageTemplate(unwrap<ApiMessageTemplate>(await apiClient.put(`/admin/templates/sms/${key}`, payload))) as ManagedSmsTemplate;
}

export async function previewSmsTemplate(key: ManagedSmsTemplate["key"], variables: Record<string, string> = {}) {
  return unwrap<SmsTemplatePreview>(
    await apiClient.post(`/admin/templates/sms/${key}/preview`, { variables }),
  );
}

export async function getSecurityConfig() {
  return normalizeSecurityConfig(unwrap<ApiSecurityConfig | null>(await apiClient.get("/admin/config/security")));
}

export async function updateSecurityConfig(payload: Omit<SecurityConfig, "id" | "createdAt" | "updatedAt">) {
  return normalizeSecurityConfig(unwrap<ApiSecurityConfig>(await apiClient.put("/admin/config/security", payload)));
}
