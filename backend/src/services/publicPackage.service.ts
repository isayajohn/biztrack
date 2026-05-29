import type { Package as PrismaPackage } from "@prisma/client";
import { prisma } from "../config/prisma";
import { money } from "../utils/mappers";
import { getOrCreateDefaultFreePackage } from "./packageLimit.service";

function serializePublicPackage(plan: PrismaPackage) {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceMonthly: money(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? null : money(plan.priceYearly),
    currency: plan.currency,
    trialDays: plan.trialDays,
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

export async function listActivePublicPackages() {
  const activeCount = await prisma.package.count({ where: { status: "ACTIVE" } });
  if (activeCount === 0) {
    await getOrCreateDefaultFreePackage(prisma);
  }

  const packages = await prisma.package.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }, { name: "asc" }],
  });

  return packages.map(serializePublicPackage);
}
