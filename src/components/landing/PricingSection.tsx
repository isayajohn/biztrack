import { PricingCard, SectionHeader } from "./LandingDesignSystem";

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

const plans: Plan[] = [
  {
    name: "Free",
    slug: "free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started tracking your business.",
    features: [
      "Sales tracking",
      "Expense tracking",
      "Basic dashboard",
      "Up to 20 products",
      "7-day history",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    slug: "pro",
    price: "$9",
    period: "per month",
    description: "For growing businesses that need deeper insights and automation.",
    features: [
      "Everything in Free",
      "Inventory alerts",
      "PDF reports",
      "Customer records",
      "Unlimited products",
      "90-day history",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    slug: "business",
    price: "$29",
    period: "per month",
    description: "For teams and established businesses with advanced needs.",
    features: [
      "Everything in Pro",
      "Multiple users",
      "Advanced reports",
      "AI insights",
      "Priority support",
      "Unlimited history",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-cloud py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Pricing"
          title="Start free, scale when you're ready"
          description="No hidden fees. No contracts. Cancel anytime."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              to={`/register?package=${encodeURIComponent(plan.slug)}`}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-slateMuted">
          All plans include a 14-day free trial on paid features. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
