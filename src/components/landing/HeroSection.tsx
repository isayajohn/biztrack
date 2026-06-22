import { useEffect, useRef } from "react";
import gsap from "gsap";
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

const DEFAULT_TRUST_INDICATORS = [
  { label: "Easy to use", icon: MousePointerClick },
  { label: "Mobile friendly", icon: Smartphone },
  { label: "Secure business data", icon: LockKeyhole },
];

const CHIP_ICONS = [MousePointerClick, Smartphone, LockKeyhole, ShieldCheck];

const DEFAULT_TITLE = "Simple sales and expense tracking for growing businesses";
const DEFAULT_SUBTITLE =
  "Track sales, expenses, products, inventory, and profit from one easy dashboard built for small business owners.";
const TRUST_TEXT = "No accounting knowledge needed. Works on phone, tablet, and desktop.";

export type HeroSectionProps = {
  title?: string;
  subtitle?: string;
  kicker?: string;
  primaryText?: string;
  primaryUrl?: string;
  secondaryText?: string;
  secondaryUrl?: string;
  trustText?: string;
  imageUrl?: string;
  trustIndicators?: Array<Record<string, unknown>> | null;
};

export default function HeroSection({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  kicker = "Built for small businesses",
  primaryText = "Get Started Free",
  primaryUrl = "/register",
  secondaryText = "View Demo",
  secondaryUrl = "#dashboard-preview",
  trustText = TRUST_TEXT,
  imageUrl,
  trustIndicators,
}: HeroSectionProps) {
  const chips = Array.isArray(trustIndicators) && trustIndicators.length > 0
    ? trustIndicators.map((item, index) => ({
        label: typeof item.label === "string" ? item.label : "",
        icon: CHIP_ICONS[index % CHIP_ICONS.length],
      })).filter((chip) => chip.label)
    : DEFAULT_TRUST_INDICATORS;
  const heroRef = useRef<HTMLElement | null>(null);
  const secondaryButtonProps = secondaryUrl.startsWith("#")
    ? { href: secondaryUrl }
    : { to: secondaryUrl };

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !heroRef.current) return undefined;

    const context = gsap.context(() => {
      gsap.set(
        [
          ".hero-kicker",
          ".hero-title",
          ".hero-copy",
          ".hero-actions",
          ".hero-trust",
          ".hero-preview",
        ],
        { autoAlpha: 0, y: 22 },
      );

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .to(".hero-kicker", { autoAlpha: 1, y: 0, duration: 0.45 })
        .to(".hero-title", { autoAlpha: 1, y: 0, duration: 0.62 }, "-=0.22")
        .to(".hero-copy", { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.3")
        .to(".hero-actions", { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.24")
        .to(".hero-trust", { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.22")
        .to(".hero-preview", { autoAlpha: 1, y: 0, duration: 0.72 }, "-=0.48")
        .from(".hero-chip", { autoAlpha: 0, y: 10, stagger: 0.08, duration: 0.32 }, "-=0.36");

      gsap.to(".hero-preview", {
        y: -8,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, heroRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="hero-pattern relative overflow-hidden pb-14 pt-20 sm:pt-24 md:pb-20 lg:pt-28"
      aria-labelledby="hero-heading"
    >
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:min-h-[620px] lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:items-center lg:gap-12">
        <div className="max-w-2xl">
          <div className="hero-kicker mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-sm font-bold text-leaf shadow-sm">
            <ShieldCheck size={15} aria-hidden="true" />
            {kicker}
          </div>

          <h1
            id="hero-heading"
            className="hero-title font-display text-4xl font-extrabold leading-[1.08] tracking-normal text-ink sm:text-5xl lg:text-[3.5rem]"
          >
            {title}
          </h1>

          <p className="hero-copy mt-5 max-w-xl text-base leading-7 text-slateMuted sm:text-lg sm:leading-8">
            {subtitle}
          </p>

          <div className="hero-actions mt-8 flex flex-col gap-3 sm:flex-row">
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

          <div className="hero-trust mt-7 border-t border-slate-200 pt-5">
            <p className="flex max-w-xl items-start gap-2 text-sm font-semibold leading-6 text-slate-700">
              <CheckCircle2 size={17} className="mt-1 shrink-0 text-leaf" aria-hidden="true" />
              <span>{trustText}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {chips.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="hero-chip inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                >
                  <Icon size={13} className="text-leaf" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-preview relative order-last min-h-[390px] w-full lg:min-h-[500px] lg:self-center lg:justify-self-end">
          {imageUrl ? (
            <div className="relative h-[390px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:h-[430px] lg:h-[500px]">
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <DashboardPreview variant="compact" />
          )}
        </div>
      </div>
    </section>
  );
}
