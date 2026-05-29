import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  MousePointerClick,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import DashboardPreview from "./DashboardPreview";
import { PrimaryButton, SecondaryButton } from "./LandingDesignSystem";

const TRUST_INDICATORS = [
  { label: "Easy to use", icon: MousePointerClick },
  { label: "Mobile friendly", icon: Smartphone },
  { label: "Secure business data", icon: LockKeyhole },
];

const DEFAULT_TITLE = "Simple sales and expense tracking for growing businesses";
const DEFAULT_SUBTITLE =
  "Track sales, expenses, products, inventory, and profit from one easy dashboard built for small business owners.";
const TRUST_TEXT = "No accounting knowledge needed. Works on phone, tablet, and desktop.";

export type HeroSectionProps = {
  title?: string;
  subtitle?: string;
  primaryText?: string;
  primaryUrl?: string;
  secondaryText?: string;
  secondaryUrl?: string;
};

export default function HeroSection({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  primaryText = "Get Started Free",
  primaryUrl = "/register",
  secondaryText = "View Demo",
  secondaryUrl = "#dashboard-preview",
}: HeroSectionProps) {
  const secondaryButtonProps = secondaryUrl.startsWith("#")
    ? { href: secondaryUrl }
    : { to: secondaryUrl };

  return (
    <section
      className="hero-pattern relative overflow-hidden pb-14 pt-20 sm:pt-24 md:pb-20 lg:pt-28"
      aria-labelledby="hero-heading"
    >
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:min-h-[620px] lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:items-center lg:gap-12">
        <div className="animate-fade-up max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-sm font-bold text-leaf shadow-sm">
            <ShieldCheck size={15} aria-hidden="true" />
            Built for small businesses
          </div>

          <h1
            id="hero-heading"
            className="font-display text-4xl font-extrabold leading-[1.08] tracking-normal text-ink sm:text-5xl lg:text-[3.5rem]"
          >
            {title}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slateMuted sm:text-lg sm:leading-8">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton
              to={primaryUrl}
              className="min-h-12 px-6 py-3.5 text-base"
              icon={<ArrowRight size={17} aria-hidden="true" />}
            >
              {primaryText}
            </PrimaryButton>
            <SecondaryButton {...secondaryButtonProps} className="min-h-12 px-6 py-3.5 text-base">
              {secondaryText}
            </SecondaryButton>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-5">
            <p className="flex max-w-xl items-start gap-2 text-sm font-semibold leading-6 text-slate-700">
              <CheckCircle2 size={17} className="mt-1 shrink-0 text-leaf" aria-hidden="true" />
              <span>{TRUST_TEXT}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {TRUST_INDICATORS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                >
                  <Icon size={13} className="text-leaf" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative order-last min-h-[390px] w-full lg:min-h-[500px] lg:self-center lg:justify-self-end">
          <DashboardPreview variant="compact" />
        </div>
      </div>
    </section>
  );
}
