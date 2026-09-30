import { apiClient, AUTH_TOKEN_KEY } from "./apiClient";
import type { RegisterData, RegisterResult, User } from "../auth/AuthContext";

type ApiBusiness = {
  id: string;
  name: string;
  currency: string;
  country?: string;
  taxName?: string;
  taxNumber?: string | null;
  defaultTaxRate?: number;
};

type ApiUser = {
  id: string;
  name: string;
  email: string | null;
  role: "USER" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  businessRole?: User["businessRole"];
  permissions?: string[];
  branch?: { id: string; name: string } | null;
  business?: ApiBusiness | null;
  businesses?: ApiBusiness[];
  onboardingIntent?: "CREATE" | "JOIN";
  requiresOnboarding?: boolean;
};

type AuthResponse = {
  token: string | null;
  user: ApiUser;
  requiresEmailVerification?: boolean;
  verificationEmailSent?: boolean;
  verificationEmailError?: boolean;
  requiresVerification?: boolean;
  verificationMethod?: "EMAIL" | "PHONE";
  verificationOtpSent?: boolean;
  phoneNumberMasked?: string | null;
  emailAddressMasked?: string | null;
  verificationId?: string;
  onboardingIntent?: "CREATE" | "JOIN";
  requiresApproval?: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  message?: string;
};

type ProfileResponse = {
  user: ApiUser;
};

type RegisterApiResult = RegisterResult & { token: string | null };

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export function mapApiUser(user: ApiUser): User {
  const business = user.business ?? user.businesses?.[0] ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    role: user.role,
    status: user.status,
    approvalStatus: user.approvalStatus ?? "APPROVED",
    businessRole: user.businessRole,
    permissions: user.permissions ?? [],
    branch: user.branch ?? null,
    businessName: business?.name ?? "My Business",
    businessId: business?.id,
    currency: business?.currency ?? "TZS",
    country: business?.country,
    onboardingIntent: user.onboardingIntent ?? "CREATE",
    requiresOnboarding: user.requiresOnboarding ?? !business,
  };
}

export async function login(identifier: string, password: string): Promise<User> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/login", { identifier, password }),
  );
  if (!result.token) throw new Error("Authentication token was not returned.");
  localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return mapApiUser(result.user);
}

export async function loginWithGoogle(credential: string): Promise<User> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/google", { credential }),
  );
  if (!result.token) throw new Error("Authentication token was not returned.");
  localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return mapApiUser(result.user);
}

export async function register(data: RegisterData): Promise<RegisterApiResult> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/register", {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      verificationMethod: data.verificationMethod,
      onboardingIntent: data.onboardingIntent,
      termsAccepted: data.termsAccepted,
      termsVersion: data.termsVersion,
      privacyVersion: data.privacyVersion,
    }),
  );
  return {
    token: result.token,
    user: mapApiUser(result.user),
    requiresVerification: Boolean(result.requiresVerification ?? result.requiresEmailVerification),
    requiresEmailVerification: Boolean(result.requiresEmailVerification),
    verificationEmailSent: Boolean(result.verificationEmailSent),
    verificationEmailError: Boolean(result.verificationEmailError),
    verificationMethod: result.verificationMethod ?? "EMAIL",
    verificationOtpSent: Boolean(result.verificationOtpSent),
    phoneNumberMasked: result.phoneNumberMasked,
    emailAddressMasked: result.emailAddressMasked,
    verificationId: result.verificationId ?? result.user.id,
    onboardingIntent: result.onboardingIntent ?? "CREATE",
    requiresApproval: Boolean(result.requiresApproval),
  };
}

export type InvitationPreview = {
  id: string;
  businessName: string;
  role: string;
  branch?: { id: string; name: string } | null;
  expiresAt: string;
};

export async function validateInvitation(code: string): Promise<InvitationPreview> {
  return unwrap<InvitationPreview>(await apiClient.post("/auth/invitations/validate", { code }));
}

export type VerificationResult = {
  user: User;
  authenticated: boolean;
  requiresApproval: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
};

export async function verifyPhone(verificationId: string, otp: string): Promise<VerificationResult> {
  const result = unwrap<AuthResponse>(await apiClient.post("/auth/verify-phone", { verificationId, otp }));
  if (result.token) localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return {
    user: mapApiUser(result.user),
    authenticated: Boolean(result.token),
    requiresApproval: Boolean(result.requiresApproval),
    approvalStatus: result.approvalStatus ?? result.user.approvalStatus ?? "APPROVED",
    message: result.message ?? "Account verified successfully.",
  };
}

export async function resendPhoneVerification(verificationId: string): Promise<{ message: string; sent: boolean }> {
  return unwrap<{ message: string; sent: boolean }>(await apiClient.post("/auth/resend-phone-verification", { verificationId }));
}

export async function resendVerificationEmail(verificationId: string): Promise<string> {
  const result = unwrap<{ message: string }>(await apiClient.post("/auth/send-verification-email", { verificationId }));
  return result.message;
}

export async function getProfile(): Promise<User> {
  const result = unwrap<ApiUser | ProfileResponse>(await apiClient.get("/auth/me"));
  return mapApiUser("user" in result ? result.user : result);
}

export async function verifyEmail(token: string): Promise<VerificationResult> {
  const result = unwrap<AuthResponse>(
    await apiClient.post("/auth/verify-email", { token }),
  );
  if (result.token) localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return {
    user: mapApiUser(result.user),
    authenticated: Boolean(result.token),
    requiresApproval: Boolean(result.requiresApproval),
    approvalStatus: result.approvalStatus ?? result.user.approvalStatus ?? "APPROVED",
    message: result.message ?? "Account verified successfully.",
  };
}

export async function forgotPassword(email: string): Promise<string> {
  const result = unwrap<{ message: string }>(
    await apiClient.post("/auth/forgot-password", { email }),
  );
  return result.message;
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const result = unwrap<{ message: string }>(
    await apiClient.post("/auth/reset-password", { token, password }),
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
  taxName?: string;
  taxNumber?: string;
  defaultTaxRate?: number;
}): Promise<ApiBusiness> {
  return unwrap<ApiBusiness>(await apiClient.put("/business", data));
}

export async function createBusinessWorkspace(data: { name: string; currency: string; country?: string }): Promise<ApiBusiness> {
  return unwrap<ApiBusiness>(await apiClient.post("/business/onboarding", data));
}

export async function acceptInvitation(code: string): Promise<ApiBusiness> {
  const result = unwrap<{ business: ApiBusiness }>(await apiClient.post("/invitations/accept", { code }));
  return result.business;
}

export async function getBusinessProfile(): Promise<ApiBusiness> {
  return unwrap<ApiBusiness>(await apiClient.get("/business"));
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
