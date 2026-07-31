import axios from "axios";
import { notifyError, notifySuccess } from "../lib/notifications";

export const AUTH_TOKEN_KEY = "biztrack_token";
export const ACTIVE_BRANCH_KEY = "biztrack_active_branch";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getRateLimitSeconds(error: unknown): number | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  const retryAfter = error.response.headers?.["retry-after"];
  const parsed = Number(Array.isArray(retryAfter) ? retryAfter[0] : retryAfter);
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 60;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const branchId = localStorage.getItem(ACTIVE_BRANCH_KEY);
  if (branchId) config.headers["X-Branch-Id"] = branchId;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const message = getMutationSuccessMessage(response.config.method, response.config.url);
    if (message) notifySuccess(message);
    return response;
  },
  (error) => {
    const requestPath = normalizeApiPath(error.config?.url);
    const isAuthRequest = requestPath.startsWith("/auth/");
    const isMutation = isMutationMethod(error.config?.method);

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new Event("biztrack:unauthorized"));
    }
    if (error.response?.status === 429) {
      window.dispatchEvent(
        new CustomEvent("biztrack:rate-limited", {
          detail: { seconds: getRateLimitSeconds(error) ?? 60 },
        }),
      );
    } else if (isMutation && !isAuthRequest && error.response?.status !== 401) {
      notifyError(getApiErrorMessage(error));
    }
    return Promise.reject(error);
  },
);

const RESOURCE_LABELS: Record<string, string> = {
  branding: "Branding",
  brands: "Brand",
  branches: "Branch",
  business: "Business profile",
  businesses: "Business",
  categories: "Category",
  config: "Configuration",
  customers: "Customer",
  "damaged-stock": "Damaged stock report",
  expenses: "Expense",
  email: "Email configuration",
  "landing-page": "Landing page",
  packages: "Package",
  products: "Product",
  promotions: "Promotion",
  purchases: "Purchase",
  sales: "Sale",
  security: "Security settings",
  sms: "SMS configuration",
  staff: "Staff member",
  stock: "Stock",
  subscriptions: "Subscription",
  suppliers: "Supplier",
  templates: "Template",
  users: "User",
};

function normalizeApiPath(url?: string) {
  if (!url) return "";
  try {
    return new URL(url, "http://biztrack.local").pathname.replace(/^\/api/, "");
  } catch {
    return url.split("?")[0];
  }
}

function isMutationMethod(method?: string) {
  return ["post", "put", "patch", "delete"].includes(method?.toLowerCase() ?? "");
}

function resourceLabel(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "admin") segments.shift();
  return RESOURCE_LABELS[segments[0]] ?? "Action";
}

export function getMutationSuccessMessage(method?: string, url?: string): string | null {
  const normalizedMethod = method?.toLowerCase() ?? "";
  if (!isMutationMethod(normalizedMethod)) return null;

  const path = normalizeApiPath(url);
  if (path === "/auth/change-password") return "Password changed successfully.";
  if (path === "/auth/forgot-password") return "Password reset instructions sent successfully.";
  if (path === "/auth/reset-password") return "Password reset successfully.";
  if (path === "/auth/verify-email") return "Email verified successfully.";
  if (path === "/auth/send-verification-email") return "Verification email sent successfully.";

  if (
    path.startsWith("/auth/") ||
    path.startsWith("/ai/") ||
    path.startsWith("/notifications/") ||
    path.includes("/preview")
  ) {
    return null;
  }

  const label = resourceLabel(path);
  if (path.includes("/approve")) return `${label} approved successfully.`;
  if (path.includes("/reject")) return `${label} rejected successfully.`;
  if (path.includes("/receive")) return `${label} received successfully.`;
  if (path.includes("/default")) return "Default branch updated successfully.";
  if (path.includes("/role")) return "User role updated successfully.";
  if (path.includes("/status")) return `${label} status updated successfully.`;
  if (path.includes("/visibility")) return "Package visibility updated successfully.";
  if (path.includes("/extend")) return "Subscription extended successfully.";
  if (path.includes("/payments")) return "Payment recorded successfully.";
  if (path.endsWith("/publish")) return "Landing page published successfully.";
  if (path.endsWith("/apk")) return "Application file uploaded successfully.";
  if (path.endsWith("/test")) return "Test message sent successfully.";
  if (path === "/stock/in") return "Stock added successfully.";
  if (path === "/stock/out") return "Stock removed successfully.";
  if (path === "/stock/adjustment") return "Stock adjustment submitted successfully.";
  if (path === "/subscriptions/checkout") return "Checkout started successfully.";
  if (/^\/admin\/businesses\/[^/]+\/package$/.test(path)) return "Business package updated successfully.";

  if (normalizedMethod === "delete") return `${label} deleted successfully.`;
  if (normalizedMethod === "put" || normalizedMethod === "patch") return `${label} updated successfully.`;
  return `${label} created successfully.`;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return `Too many requests. Please wait ${getRateLimitSeconds(error) ?? 60} seconds, then try again.`;
    }
    const message = error.response?.data?.message ?? error.response?.data?.error;
    if (typeof message === "string") return message;
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function getApiErrorDetails<T = unknown>(error: unknown): T | null {
  if (!axios.isAxiosError(error)) return null;
  return (error.response?.data?.details as T | undefined) ?? null;
}

export function isPackageAccessError(error: unknown): boolean {
  const details = getApiErrorDetails<{ code?: string; action?: string }>(error);
  return details?.code === "PACKAGE_ACCESS_REQUIRED" || details?.action === "UPGRADE_PACKAGE";
}

export function isPaymentProviderError(error: unknown): boolean {
  const details = getApiErrorDetails<{ code?: string; provider?: string }>(error);
  return Boolean(details?.code?.startsWith("PAYMENT_PROVIDER_") || details?.provider === "AZAMPAY");
}
