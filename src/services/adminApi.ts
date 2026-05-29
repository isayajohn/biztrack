import { apiClient } from "./apiClient";
import type { AppBranding } from "./landingApi";

export type AdminRole = "USER" | "SUPER_ADMIN";
export type AdminStatus = "ACTIVE" | "SUSPENDED";
export type PackageStatus = "ACTIVE" | "INACTIVE";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
export type BillingCycle = "MONTHLY" | "YEARLY" | "LIFETIME" | "MANUAL";
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

export async function getAdminStats() {
  return unwrap<PlatformStats>(await apiClient.get("/admin/stats"));
}

export async function getSystemSummary() {
  return unwrap<SystemSummary>(await apiClient.get("/admin/summary"));
}

export async function getAdminBranding() {
  return unwrap<AppBranding>(await apiClient.get("/admin/branding"));
}

export async function updateAdminBranding(payload: {
  logoDataUrl: string;
  logoFileName?: string | null;
  logoMimeType?: string | null;
}) {
  return unwrap<AppBranding>(await apiClient.put("/admin/branding", payload));
}

export async function removeAdminBrandingLogo() {
  return unwrap<AppBranding>(await apiClient.delete("/admin/branding/logo"));
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
  return unwrap<PaginatedResult<AdminUser>>(await apiClient.get("/admin/users", { params }));
}

export async function getAdminBusinessesPage(params: {
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
} = {}) {
  return unwrap<PaginatedResult<AdminBusiness>>(await apiClient.get("/admin/businesses", { params }));
}

export async function getAdminBusinesses() {
  const result = await getAdminBusinessesPage({ limit: 100 });
  return result.items;
}

export async function getAdminBusiness(id: string) {
  return unwrap<AdminBusinessDetails>(await apiClient.get(`/admin/businesses/${id}`));
}

export async function getAuditLogs(params: AuditLogsQuery = {}) {
  return unwrap<PaginatedResult<AuditLog>>(await apiClient.get("/admin/audit-logs", { params }));
}

export async function getAdminPackages() {
  return unwrap<AdminPackage[]>(await apiClient.get("/admin/packages"));
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
  return unwrap<PaginatedResult<AdminSubscription>>(
    await apiClient.get("/admin/subscriptions", { params }),
  );
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

export async function getAdminLandingContent() {
  return unwrap<LandingPageContent>(await apiClient.get("/admin/landing-page"));
}

export async function updateAdminLandingContent(payload: LandingPageContent) {
  return unwrap<LandingPageContent>(await apiClient.put("/admin/landing-page", payload));
}

export async function publishAdminLandingContent() {
  return unwrap<LandingPageContent>(await apiClient.post("/admin/landing-page/publish"));
}

export async function getEmailSettings() {
  return unwrap<EmailSettings>(await apiClient.get("/admin/email"));
}

export async function getEmailConfig() {
  return unwrap<EmailConfig | null>(await apiClient.get("/admin/config/email"));
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
  return unwrap<EmailConfig>(await apiClient.put("/admin/config/email", payload));
}

export async function sendTestEmail(payload: { to: string }) {
  return unwrap<EmailTestResult>(await apiClient.post("/admin/config/email/test", payload));
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
  return unwrap<EmailConfig>(await apiClient.put("/admin/email/config", payload));
}

export async function updateEmailTemplate(key: TemplateKey, payload: {
  subject?: string | null;
  body: string;
  isActive: boolean;
}) {
  return unwrap<MessageTemplate>(await apiClient.put(`/admin/email/templates/${key}`, payload));
}

export async function getEmailTemplates() {
  return unwrap<ManagedEmailTemplate[]>(await apiClient.get("/admin/templates/email"));
}

export async function getEmailTemplate(key: TemplateKey) {
  return unwrap<ManagedEmailTemplate>(await apiClient.get(`/admin/templates/email/${key}`));
}

export async function updateManagedEmailTemplate(key: TemplateKey, payload: {
  subject: string;
  body: string;
  isActive: boolean;
}) {
  return unwrap<ManagedEmailTemplate>(await apiClient.put(`/admin/templates/email/${key}`, payload));
}

export async function previewEmailTemplate(key: TemplateKey, variables: Record<string, string> = {}) {
  return unwrap<EmailTemplatePreview>(
    await apiClient.post(`/admin/templates/email/${key}/preview`, { variables }),
  );
}

export async function getSmsSettings() {
  return unwrap<SmsSettings>(await apiClient.get("/admin/sms"));
}

export async function getSmsConfig() {
  return unwrap<SmsConfig | null>(await apiClient.get("/admin/config/sms"));
}

export async function updateSmsProviderConfig(payload: {
  provider: ConfigProvider;
  baseUrl?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  senderId?: string | null;
  isActive: boolean;
}) {
  return unwrap<SmsConfig>(await apiClient.put("/admin/config/sms", payload));
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
  return unwrap<SmsConfig>(await apiClient.put("/admin/sms/config", payload));
}

export async function updateSmsTemplate(key: TemplateKey, payload: {
  subject?: string | null;
  body: string;
  isActive: boolean;
}) {
  return unwrap<MessageTemplate>(await apiClient.put(`/admin/sms/templates/${key}`, payload));
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
  return unwrap<ManagedSmsTemplate[]>(await apiClient.get("/admin/templates/sms"));
}

export async function getSmsTemplate(key: ManagedSmsTemplate["key"]) {
  return unwrap<ManagedSmsTemplate>(await apiClient.get(`/admin/templates/sms/${key}`));
}

export async function updateManagedSmsTemplate(key: ManagedSmsTemplate["key"], payload: {
  body: string;
  isActive: boolean;
}) {
  return unwrap<ManagedSmsTemplate>(await apiClient.put(`/admin/templates/sms/${key}`, payload));
}

export async function previewSmsTemplate(key: ManagedSmsTemplate["key"], variables: Record<string, string> = {}) {
  return unwrap<SmsTemplatePreview>(
    await apiClient.post(`/admin/templates/sms/${key}/preview`, { variables }),
  );
}

export async function getSecurityConfig() {
  return unwrap<SecurityConfig>(await apiClient.get("/admin/config/security"));
}

export async function updateSecurityConfig(payload: Omit<SecurityConfig, "id" | "createdAt" | "updatedAt">) {
  return unwrap<SecurityConfig>(await apiClient.put("/admin/config/security", payload));
}
