import { useEffect, useMemo, useState } from "react";
import { PricingCard, SectionHeader } from "./LandingDesignSystem";
import { getPublicPackages, type PublicPackage } from "../../services/landingApi";
import { formatCurrency } from "../../utils/format";

type Plan = {
  name: string;
  slug: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
};

function limitLabel(label: string, value: number) {
  if (value === 0) return null;
  return `Up to ${value.toLocaleString()} ${label}`;
}

function packageFeatures(plan: PublicPackage) {
  return [
    limitLabel("businesses", plan.limits.maxBusinesses),
    limitLabel("users", plan.limits.maxUsers),
    limitLabel("products", plan.limits.maxProducts),
    limitLabel("sales per month", plan.limits.maxSalesPerMonth),
    limitLabel("expenses per month", plan.limits.maxExpensesPerMonth),
    plan.features.allowReports ? "Reports dashboard" : null,
    plan.features.allowPdfExport ? "PDF exports" : null,
    plan.features.allowCsvExport ? "CSV exports" : null,
    plan.features.allowInventoryAlerts ? "Inventory alerts" : null,
    plan.features.allowAiInsights ? "AI insights" : null,
    plan.trialDays > 0 ? `${plan.trialDays}-day trial` : null,
  ].filter((feature): feature is string => Boolean(feature));
}

function packagePrice(plan: PublicPackage) {
  if (plan.priceMonthly === 0) return "Free";
  return formatCurrency(plan.priceMonthly, plan.currency);
}

function packagePeriod(plan: PublicPackage) {
  return plan.priceMonthly === 0 ? "forever" : "month";
}

function packageCta(plan: PublicPackage) {
  if (plan.priceMonthly === 0) return "Get Started Free";
  return plan.trialDays > 0 ? "Start Trial" : "Get Started";
}

function packageDescription(plan: PublicPackage) {
  return plan.description || "Configured by admin with package-specific limits and feature access.";
}

export default function PricingSection() {
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getPublicPackages()
      .then((plans) => {
        if (alive) setPackages(plans);
      })
      .catch(() => {
        if (alive) setPackages([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const plans = useMemo<Plan[]>(() => {
    const highlightedPackage =
      packages.find((plan) => plan.slug.toLowerCase() === "pro") ??
      packages.find((plan) => plan.priceMonthly > 0) ??
      packages[Math.min(1, packages.length - 1)];

    return packages.map((plan) => {
      const highlighted = plan.id === highlightedPackage?.id;

      return {
        name: plan.name,
        slug: plan.slug,
        price: packagePrice(plan),
        period: packagePeriod(plan),
        description: packageDescription(plan),
        features: packageFeatures(plan),
        cta: packageCta(plan),
        highlighted,
        badge: highlighted && packages.length > 1 ? "Most Popular" : undefined,
      };
    });
  }, [packages]);

  return (
    <section id="pricing" className="scroll-mt-20 bg-cloud py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Pricing"
          title="Start free, scale when you're ready"
          description="No hidden fees. No contracts. Cancel anytime."
          align="center"
        />

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
            ))}
          </div>
        ) : plans.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard
                key={plan.slug}
                {...plan}
                to={`/register?package=${encodeURIComponent(plan.slug)}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <p className="font-display text-xl font-extrabold text-ink">Packages are being updated.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slateMuted">
              Please check back soon or create an account to use the default package.
            </p>
          </div>
        )}

        {plans.some((plan) => plan.features.some((feature) => feature.toLowerCase().includes("trial"))) && (
          <p className="mt-8 text-center text-sm font-semibold text-slateMuted">
            Trial length is based on the package configured by admin. No credit card required to start.
          </p>
        )}
      </div>
    </section>
  );
}
