import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
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
  to: string;
};

type PricingContent = {
  name?: unknown;
  title?: unknown;
  price?: unknown;
  description?: unknown;
  features?: unknown;
  buttonText?: unknown;
  buttonUrl?: unknown;
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

function textFrom(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function featureListFrom(value: unknown) {
  return Array.isArray(value) ? value.map(textFrom).filter(Boolean) : [];
}

function contentPlansFrom(items?: PricingContent[] | null): Plan[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const name = textFrom(item.name) || textFrom(item.title);
      const price = textFrom(item.price);
      return {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `plan-${index + 1}`,
        price,
        period: price.toLowerCase() === "free" ? "forever" : "month",
        description: textFrom(item.description),
        features: featureListFrom(item.features),
        cta: textFrom(item.buttonText) || "Get Started",
        to: textFrom(item.buttonUrl) || "/register",
        highlighted: index === 1,
        badge: index === 1 ? "Most Popular" : undefined,
      };
    })
    .filter((plan) => plan.name && plan.price && plan.description);
}

function packageDescription(plan: PublicPackage) {
  return plan.description || "Configured by admin with package-specific limits and feature access.";
}

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  pricing?: PricingContent[] | null;
};

export default function PricingSection({ eyebrow, title, description, pricing }: Props) {
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const contentPlans = useMemo(() => contentPlansFrom(pricing), [pricing]);

  useEffect(() => {
    if (contentPlans.length > 0) {
      setIsLoading(false);
      return undefined;
    }

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
  }, [contentPlans.length]);

  const plans = useMemo<Plan[]>(() => {
    if (contentPlans.length > 0) return contentPlans;

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
        to: `/register?package=${encodeURIComponent(plan.slug)}`,
        highlighted,
        badge: highlighted && packages.length > 1 ? "Most Popular" : undefined,
      };
    });
  }, [contentPlans, packages]);

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-white/5 bg-[#0a0c0b] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#12e4d7]">{eyebrow || "Pricing"}</p>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            {title || <>Simple, transparent <span className="text-white/[0.35]">pricing.</span></>}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/[0.45]">
            {description || "Start free. Upgrade when your business is ready. No hidden fees and no long contracts."}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[470px] animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.035]" />
            ))}
          </div>
        ) : plans.length > 0 ? (
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const highlighted = plan.highlighted;
              return (
                <article key={plan.slug} className={`relative flex min-h-[470px] flex-col overflow-hidden rounded-[1.75rem] border p-7 transition-transform hover:-translate-y-1 ${highlighted ? "border-[#12e4d7]/40 bg-[#12e4d7]/[0.065] shadow-[0_0_80px_rgba(18,228,215,0.08)]" : "border-white/10 bg-white/[0.025]"}`}>
                  {plan.badge && <span className="absolute right-5 top-5 rounded-full bg-[#12e4d7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#051210]">{plan.badge}</span>}
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/[0.45]">{plan.name}</p>
                  <div className="mt-7 flex items-end gap-2">
                    <span className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{plan.price}</span>
                    <span className="mb-2 text-sm text-white/30">/{plan.period}</span>
                  </div>
                  <p className="mt-5 min-h-12 text-sm leading-6 text-white/[0.42]">{plan.description}</p>
                  <div className="my-7 h-px bg-white/[0.08]" />
                  <ul className="flex-1 space-y-3.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/[0.65]">
                        <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#12e4d7]/10 text-[#12e4d7]"><Check size={12} /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.to} className={`mt-8 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${highlighted ? "bg-[#12e4d7] text-[#051210] hover:bg-white" : "border border-white/[0.12] bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08]"}`}>
                    {plan.cta} <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-14 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="font-display text-xl font-bold text-white">Packages are being updated.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/40">
              Please check back soon or create an account to use the default package.
            </p>
          </div>
        )}

        {plans.some((plan) => plan.features.some((feature) => feature.toLowerCase().includes("trial"))) && (
          <p className="mt-8 text-center text-sm font-semibold text-white/[0.35]">
            Trial length is based on the package configured by admin. No credit card required to start.
          </p>
        )}
      </div>
    </section>
  );
}
