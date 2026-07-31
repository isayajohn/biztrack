import { ArrowRight, Sparkles } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "./LandingDesignSystem";

type Props = {
  kicker?: string | null;
  title?: string | null;
  description?: string | null;
  primaryText?: string | null;
  primaryUrl?: string | null;
  secondaryText?: string | null;
  secondaryUrl?: string | null;
};

export default function FinalCTA({
  kicker,
  title,
  description,
  primaryText,
  primaryUrl,
  secondaryText,
  secondaryUrl,
}: Props) {
  return (
    <section
      className="relative overflow-hidden bg-ink py-16 sm:py-20"
      aria-labelledby="cta-heading"
    >
      {/* Dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />
      {/* Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-leaf/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-1.5 text-sm font-semibold text-white/70">
          <Sparkles size={14} aria-hidden="true" />
          {kicker || "Free forever on the basic plan"}
        </span>

        <h2
          id="cta-heading"
          className="font-display text-3xl font-extrabold text-white sm:text-5xl"
        >
          {title || (
            <>
              Start tracking your <span className="text-leaf">business</span> today
            </>
          )}
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/55">
          {description || "Join thousands of small business owners who use BizTrack to understand their numbers and grow with confidence."}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton
            to={primaryUrl || "/register"}
            className="px-8 py-3.5 text-base"
            icon={<ArrowRight size={18} aria-hidden="true" />}
          >
            {primaryText || "Get Started Free"}
          </PrimaryButton>
          <SecondaryButton
            to={secondaryUrl || "/demo"}
            className="border-white/15 bg-white/5 px-8 py-3.5 text-base text-white hover:border-white/25 hover:bg-white/10"
          >
            {secondaryText || "View Demo"}
          </SecondaryButton>
        </div>

        <p className="mt-5 text-xs font-semibold text-white/30">
          No credit card required · Cancel anytime · Instant setup
        </p>
      </div>
    </section>
  );
}
