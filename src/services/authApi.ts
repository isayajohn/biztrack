import { apiClient, AUTH_TOKEN_KEY } from "./apiClient";
import type { RegisterData, RegisterResult, User } from "../auth/AuthContext";

type ApiBusiness = {
  id: string;
  name: string;
  currency: string;
  country?: string;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  business?: ApiBusiness | null;
  businesses?: ApiBusiness[];
};

type AuthResponse = {
  token: string;
  user: ApiUser;
  requiresEmailVerification?: boolean;
  verificationEmailSent?: boolean;
  verificationEmailError?: boolean;
};

type RegisterApiResult = RegisterResult & { token: string };

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export function mapApiUser(user: ApiUser): User {
  const business = user.business ?? user.businesses?.[0] ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    businessName: business?.name ?? "My Business",
    businessId: business?.id,
    currency: business?.currency ?? "USD",
    country: business?.country,
  };
}

export async function login(email: string, password: string): Promise<User> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/login", { email, password }),
  );
  localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return mapApiUser(result.user);
}

export async function register(data: RegisterData): Promise<RegisterApiResult> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/register", {
      name: data.name,
      email: data.email,
      password: data.password,
      businessName: data.businessName,
      currency: data.currency,
      country: data.country ?? "Tanzania",
      packageId: data.packageId,
    }),
  );
  return {
    token: result.token,
    user: mapApiUser(result.user),
    requiresEmailVerification: Boolean(result.requiresEmailVerification),
    verificationEmailSent: Boolean(result.verificationEmailSent),
    verificationEmailError: Boolean(result.verificationEmailError),
  };
}

export async function getProfile(): Promise<User> {
  const user = unwrap<ApiUser>(await apiClient.get("/auth/me"));
  return mapApiUser(user);
}

export async function verifyEmail(token: string): Promise<User> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/verify-email", { token }),
  );
  localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return mapApiUser(result.user);
}

export async function forgotPassword(email: string): Promise<string> {
  const result = unwrap<{ message: string }>(
    await apiClient.post("/auth/forgot-password", { email }),
  );
  return result.message;
}

export async function updateBusinessProfile(data: {
  name: string;
  ownerName: string;
  email: string;
  phone?: string;
  country: string;
  currency: string;
}): Promise<ApiBusiness> {
  return unwrap<ApiBusiness>(await apiClient.put("/business", data));
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
