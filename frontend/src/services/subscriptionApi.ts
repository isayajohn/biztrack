import { apiClient } from "./apiClient";
import type { PublicPackage } from "./landingApi";

export type BillingCycle = "MONTHLY" | "YEARLY";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type BusinessSubscription = {
  id: string;
  businessId: string;
  packageId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle | "LIFETIME" | "MANUAL";
  startsAt: string;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  notes?: string | null;
  package: PublicPackage;
  createdAt: string;
  updatedAt: string;
};

export type PaymentTransaction = {
  id: string;
  businessId: string;
  packageId: string;
  status: PaymentStatus;
  billingCycle: BillingCycle | "LIFETIME" | "MANUAL";
  amount: number;
  currency: string;
  provider: string;
  externalId: string;
  providerReference?: string | null;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  package: PublicPackage;
  createdAt: string;
  updatedAt: string;
};

export type BusinessSubscriptionOverview = {
  subscription: BusinessSubscription | null;
  payments: PaymentTransaction[];
};

export type CheckoutResponse = {
  checkoutUrl?: string | null;
  payment?: PaymentTransaction | null;
  subscription?: BusinessSubscription | null;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export async function getBusinessSubscription() {
  return unwrap<BusinessSubscriptionOverview>(await apiClient.get("/subscriptions/current"));
}

export async function createSubscriptionCheckout(payload: {
  packageId: string;
  billingCycle: BillingCycle;
  customerPhone?: string;
}) {
  return unwrap<CheckoutResponse>(await apiClient.post("/subscriptions/checkout", payload));
}
