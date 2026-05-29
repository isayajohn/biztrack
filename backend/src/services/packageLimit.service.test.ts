import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../utils/AppError";
import {
  createPackageLimitService,
  PACKAGE_LIMIT_ERROR_MESSAGE,
} from "./packageLimit.service";

const now = new Date("2026-05-08T12:00:00.000Z");

function plan(overrides: Record<string, unknown> = {}) {
  return {
    id: "package-1",
    name: "Test Package",
    slug: "test-package",
    description: null,
    priceMonthly: { toString: () => "0" },
    priceYearly: null,
    currency: "USD",
    maxBusinesses: 1,
    maxUsers: 1,
    maxProducts: 2,
    maxSalesPerMonth: 3,
    maxExpensesPerMonth: 4,
    allowReports: true,
    allowPdfExport: false,
    allowCsvExport: false,
    allowInventoryAlerts: false,
    allowAiInsights: true,
    status: "ACTIVE",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function subscription(overrides: Record<string, unknown> = {}) {
  const packageRecord = (overrides.package as Record<string, unknown> | undefined) ?? plan();
  return {
    id: "subscription-1",
    businessId: "business-1",
    packageId: packageRecord.id,
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    startsAt: new Date("2026-05-01T00:00:00.000Z"),
    endsAt: null,
    trialEndsAt: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    package: packageRecord,
    ...overrides,
  };
}

function mockClient({
  activeSubscription = subscription(),
  latestSubscription = null,
  productCount = 0,
  saleCount = 0,
  expenseCount = 0,
}: {
  activeSubscription?: Record<string, unknown> | null;
  latestSubscription?: Record<string, unknown> | null;
  productCount?: number;
  saleCount?: number;
  expenseCount?: number;
} = {}) {
  const calls: Record<string, unknown> = {};

  return {
    calls,
    client: {
      business: {
        findUnique: async () => ({ id: "business-1" }),
      },
      businessSubscription: {
        findFirst: async (args: { where?: { status?: unknown } }) => {
          if (args.where?.status) return activeSubscription;
          return latestSubscription;
        },
        create: async (args: Record<string, unknown>) => {
          calls.createdDefaultSubscription = args;
          const packageRecord = plan({ slug: "free", allowReports: false, allowAiInsights: false });
          return subscription({
            id: "free-subscription",
            packageId: packageRecord.id,
            billingCycle: "MANUAL",
            package: packageRecord,
          });
        },
      },
      package: {
        upsert: async (args: Record<string, unknown>) => {
          calls.upsertedDefaultPackage = args;
          return plan({ id: "free-package", slug: "free", allowReports: false, allowAiInsights: false });
        },
      },
      product: {
        count: async () => productCount,
      },
      sale: {
        count: async (args: Record<string, unknown>) => {
          calls.saleCountArgs = args;
          return saleCount;
        },
      },
      expense: {
        count: async () => expenseCount,
      },
    },
  };
}

function assertPackageLimitError(error: unknown) {
  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 403);
  assert.equal(error.message, PACKAGE_LIMIT_ERROR_MESSAGE);
  return true;
}

describe("package limit service", () => {
  it("blocks feature access when the active package does not include the feature", async () => {
    const { client } = mockClient({
      activeSubscription: subscription({ package: plan({ allowReports: false }) }),
    });
    const service = createPackageLimitService(client as never);

    await assert.rejects(
      () => service.checkPackageFeature("business-1", "allowReports", { now }),
      assertPackageLimitError,
    );
  });

  it("blocks restricted actions when the latest subscription is suspended", async () => {
    const { client } = mockClient({
      activeSubscription: null,
      latestSubscription: subscription({ status: "SUSPENDED" }),
    });
    const service = createPackageLimitService(client as never);

    await assert.rejects(
      () => service.checkPackageLimit("business-1", "maxProducts", { now }),
      assertPackageLimitError,
    );
  });

  it("blocks product creation when maxProducts is reached", async () => {
    const { client } = mockClient({
      activeSubscription: subscription({ package: plan({ maxProducts: 2 }) }),
      productCount: 2,
    });
    const service = createPackageLimitService(client as never);

    await assert.rejects(
      () => service.checkPackageLimit("business-1", "maxProducts", { now }),
      assertPackageLimitError,
    );
  });

  it("blocks sale creation when maxSalesPerMonth is reached", async () => {
    const { client, calls } = mockClient({
      activeSubscription: subscription({ package: plan({ maxSalesPerMonth: 3 }) }),
      saleCount: 3,
    });
    const service = createPackageLimitService(client as never);

    await assert.rejects(
      () =>
        service.checkPackageLimit("business-1", "maxSalesPerMonth", {
          date: "2026-05-08",
          now,
        }),
      assertPackageLimitError,
    );

    assert.deepEqual(calls.saleCountArgs, {
      where: {
        businessId: "business-1",
        saleDate: {
          gte: new Date("2026-05-01T00:00:00.000Z"),
          lt: new Date("2026-06-01T00:00:00.000Z"),
        },
      },
    });
  });

  it("creates a default Free subscription when a business has no subscriptions", async () => {
    const { client, calls } = mockClient({
      activeSubscription: null,
      latestSubscription: null,
    });
    const service = createPackageLimitService(client as never);

    const activeSubscription = await service.getBusinessActiveSubscription("business-1", { now });

    assert.equal(activeSubscription.id, "free-subscription");
    assert.ok(calls.upsertedDefaultPackage);
    assert.ok(calls.createdDefaultSubscription);
  });
});
