import { Prisma } from "@prisma/client";
import type { BillingCycle, PaymentTransactionStatus, SubscriptionStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { money } from "../utils/mappers";
import { getDefaultBusinessId } from "./businessAccess.service";
import { createAzamPayCheckout } from "./azamPay.service";
import type { SubscriptionCheckoutInput } from "../validators/subscription.validators";

const activeSubscriptionStatuses: SubscriptionStatus[] = ["TRIAL", "ACTIVE"];

const subscriptionInclude = {
  package: true,
} satisfies Prisma.BusinessSubscriptionInclude;

const transactionInclude = {
  package: true,
} satisfies Prisma.PaymentTransactionInclude;

type SubscriptionWithPackage = Prisma.BusinessSubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;

type TransactionWithPackage = Prisma.PaymentTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

function publicAppUrl() {
  return (env.appUrl ?? env.corsOrigins[0] ?? "http://127.0.0.1:5173").replace(/\/+$/, "");
}

function callbackUrl() {
  return (
    env.azamPay.callbackUrl ??
    `http://127.0.0.1:${env.port}/api/subscriptions/azam-pay/callback`
  );
}

function returnUrl(externalId: string) {
  const base = env.azamPay.returnUrl ?? `${publicAppUrl()}/subscription`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}payment=${encodeURIComponent(externalId)}`;
}

function addBillingPeriod(date: Date, billingCycle: BillingCycle) {
  const next = new Date(date);
  if (billingCycle === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function serializePackage(plan: SubscriptionWithPackage["package"] | TransactionWithPackage["package"]) {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceMonthly: money(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? null : money(plan.priceYearly),
    currency: plan.currency,
    trialDays: plan.trialDays,
    status: plan.status,
    sortOrder: plan.sortOrder,
    limits: {
      maxBusinesses: plan.maxBusinesses,
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxProducts,
      maxSalesPerMonth: plan.maxSalesPerMonth,
      maxExpensesPerMonth: plan.maxExpensesPerMonth,
    },
    features: {
      allowReports: plan.allowReports,
      allowPdfExport: plan.allowPdfExport,
      allowCsvExport: plan.allowCsvExport,
      allowInventoryAlerts: plan.allowInventoryAlerts,
      allowAiInsights: plan.allowAiInsights,
    },
  };
}

function serializeSubscription(subscription: SubscriptionWithPackage | null) {
  if (!subscription) return null;

  return {
    id: subscription.id,
    businessId: subscription.businessId,
    packageId: subscription.packageId,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    startsAt: subscription.startsAt,
    endsAt: subscription.endsAt,
    trialEndsAt: subscription.trialEndsAt,
    notes: subscription.notes,
    package: serializePackage(subscription.package),
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

function serializeTransaction(transaction: TransactionWithPackage) {
  return {
    id: transaction.id,
    businessId: transaction.businessId,
    packageId: transaction.packageId,
    status: transaction.status,
    billingCycle: transaction.billingCycle,
    amount: money(transaction.amount),
    currency: transaction.currency,
    provider: transaction.provider,
    externalId: transaction.externalId,
    providerReference: transaction.providerReference,
    checkoutUrl: transaction.checkoutUrl,
    paidAt: transaction.paidAt,
    failedAt: transaction.failedAt,
    package: serializePackage(transaction.package),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return Number(value.toString());
}

function transactionStatusFromCallback(payload: Record<string, unknown>): PaymentTransactionStatus {
  const rawStatus =
    payload.status ??
    payload.transactionStatus ??
    payload.paymentStatus ??
    payload.result ??
    payload.message;
  const status = String(rawStatus ?? "").trim().toLowerCase();

  if (["success", "successful", "paid", "completed", "approved"].includes(status)) return "PAID";
  if (["failed", "failure", "declined", "rejected", "expired"].includes(status)) return "FAILED";
  if (["cancelled", "canceled"].includes(status)) return "CANCELLED";
  return "PENDING";
}

function callbackReference(payload: Record<string, unknown>) {
  const keys = [
    "externalId",
    "external_id",
    "reference",
    "merchantReference",
    "transactionId",
    "transaction_id",
    "paymentId",
    "payment_id",
  ];

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

async function getCurrentBusinessSubscription(businessId: string) {
  return prisma.businessSubscription.findFirst({
    where: { businessId },
    include: subscriptionInclude,
    orderBy: [{ updatedAt: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
  });
}

async function activatePaidSubscription(
  tx: Prisma.TransactionClient,
  transaction: { id: string; businessId: string; packageId: string; billingCycle: BillingCycle },
) {
  const now = new Date();

  await tx.businessSubscription.updateMany({
    where: {
      businessId: transaction.businessId,
      status: { in: activeSubscriptionStatuses },
    },
    data: { status: "CANCELLED" },
  });

  const subscription = await tx.businessSubscription.create({
    data: {
      businessId: transaction.businessId,
      packageId: transaction.packageId,
      status: "ACTIVE",
      billingCycle: transaction.billingCycle,
      startsAt: now,
      endsAt: addBillingPeriod(now, transaction.billingCycle),
      notes: "Activated by AzamPay payment.",
    },
    include: subscriptionInclude,
  });

  await tx.paymentTransaction.update({
    where: { id: transaction.id },
    data: { subscriptionId: subscription.id },
  });

  return subscription;
}

export async function getBusinessSubscription(userId: string) {
  const businessId = await getDefaultBusinessId(userId);
  const [subscription, transactions] = await Promise.all([
    getCurrentBusinessSubscription(businessId),
    prisma.paymentTransaction.findMany({
      where: { businessId },
      include: transactionInclude,
      orderBy: [{ createdAt: "desc" }],
      take: 10,
    }),
  ]);

  return {
    subscription: serializeSubscription(subscription),
    payments: transactions.map(serializeTransaction),
  };
}

export async function createSubscriptionCheckout(userId: string, input: SubscriptionCheckoutInput) {
  const businessId = await getDefaultBusinessId(userId);
  const [business, plan] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        currency: true,
        country: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    }),
    prisma.package.findFirst({
      where: { id: input.packageId, status: "ACTIVE" },
    }),
  ]);

  if (!business) throw new AppError("Business profile not found.", 404);
  if (!plan) throw new AppError("Selected package is not available.", 400);

  const rawAmount =
    input.billingCycle === "YEARLY" && plan.priceYearly
      ? decimalToNumber(plan.priceYearly)
      : decimalToNumber(plan.priceMonthly);
  const amount = Number(rawAmount.toFixed(2));

  if (amount <= 0) {
    const subscription = await prisma.$transaction(async (tx) =>
      activatePaidSubscription(tx, {
        id: (
          await tx.paymentTransaction.create({
            data: {
              businessId,
              packageId: plan.id,
              status: "PAID",
              billingCycle: "MANUAL",
              amount: 0,
              currency: plan.currency,
              externalId: `BT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              provider: "MANUAL",
              paidAt: new Date(),
            },
          })
        ).id,
        businessId,
        packageId: plan.id,
        billingCycle: "MANUAL",
      }),
    );

    return {
      checkoutUrl: null,
      payment: null,
      subscription: serializeSubscription(subscription),
    };
  }

  const externalId = `BT-${businessId.slice(0, 8)}-${Date.now()}`;
  const requestPayload = {
    amount,
    currency: plan.currency,
    description: `BizTrack ${plan.name} ${input.billingCycle.toLowerCase()} subscription`,
    externalId,
    callbackUrl: callbackUrl(),
    returnUrl: returnUrl(externalId),
    customer: {
      name: business.user.name,
      email: business.user.email,
      phone: input.customerPhone ?? business.user.phone ?? null,
      businessName: business.name,
    },
  };

  const payment = await prisma.paymentTransaction.create({
    data: {
      businessId,
      packageId: plan.id,
      status: "PENDING",
      billingCycle: input.billingCycle,
      amount,
      currency: plan.currency,
      externalId,
      rawRequest: requestPayload,
    },
    include: transactionInclude,
  });

  try {
    const checkout = await createAzamPayCheckout(requestPayload);
    const updatedPayment = await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        providerReference: checkout.providerReference,
        checkoutUrl: checkout.checkoutUrl,
        rawResponse: checkout.rawResponse as Prisma.InputJsonValue,
      },
      include: transactionInclude,
    });

    return {
      checkoutUrl: checkout.checkoutUrl,
      payment: serializeTransaction(updatedPayment),
      subscription: null,
    };
  } catch (error) {
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        rawResponse: {
          message: error instanceof Error ? error.message : "AzamPay checkout failed.",
        },
      },
    });
    throw error;
  }
}

export async function handleAzamPayCallback(payload: Record<string, unknown>) {
  const reference = callbackReference(payload);
  if (!reference) throw new AppError("Payment callback reference is missing.", 400);

  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      OR: [{ externalId: reference }, { providerReference: reference }],
    },
  });

  if (!transaction) throw new AppError("Payment transaction not found.", 404);

  const nextStatus = transactionStatusFromCallback(payload);
  const now = new Date();

  if (transaction.status === "PAID") {
    return { status: transaction.status, externalId: transaction.externalId };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: nextStatus,
        rawResponse: payload as Prisma.InputJsonValue,
        paidAt: nextStatus === "PAID" ? now : transaction.paidAt,
        failedAt: ["FAILED", "CANCELLED"].includes(nextStatus) ? now : transaction.failedAt,
      },
    });

    if (nextStatus !== "PAID") return { transaction: updated, subscription: null };

    const subscription = await activatePaidSubscription(tx, updated);
    return { transaction: updated, subscription };
  });

  return {
    status: result.transaction.status,
    externalId: result.transaction.externalId,
    subscription: serializeSubscription(result.subscription),
  };
}
