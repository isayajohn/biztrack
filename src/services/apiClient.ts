import axios from "axios";

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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new Event("biztrack:unauthorized"));
    }
    if (error.response?.status === 429) {
      window.dispatchEvent(
        new CustomEvent("biztrack:rate-limited", {
          detail: { seconds: getRateLimitSeconds(error) ?? 60 },
        }),
      );
    }
    return Promise.reject(error);
  },
);

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
