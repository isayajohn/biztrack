import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowRight, Check, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingLanguage } from "../../i18n/LandingLanguageContext";

const DEFAULT_TITLE = "Most business owners are flying blind. You don't have to.";
const DEFAULT_SUBTITLE =
  "BizTrack brings sales, expenses, inventory, customers, debts and reports together in real time — so every decision is backed by numbers you can trust.";

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
  kicker = "AI-powered business management for Africa",
  primaryText = "Start free",
  primaryUrl = "/register",
  trustText = "No credit card required · Setup in minutes",
  imageUrl,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const { isSwahili } = useLandingLanguage();
  const displayTitle = isSwahili ? "Wamiliki wengi wa biashara hawana picha kamili. Wewe si lazima uwe hivyo." : title;
  const displaySubtitle = isSwahili
    ? "BizTrack inaunganisha mauzo, matumizi, stoo, wateja, madeni na ripoti kwa wakati halisi — ili kila uamuzi utegemee takwimu unazoweza kuamini."
    : subtitle;
  const displayKicker = isSwahili ? "Usimamizi wa biashara unaotumia AI kwa Afrika" : kicker;
  const displayPrimaryText = isSwahili ? "Anza bure" : primaryText;
  const displayTrustText = isSwahili ? "Huhitaji kadi ya benki · Sanidi kwa dakika chache" : trustText;

  useEffect(() => {
    if (!heroRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from(".hero-reveal", {
        opacity: 0,
        y: 34,
        filter: "blur(9px)",
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.from(".hero-art", { opacity: 0, y: 70, scale: 0.96, duration: 1.15, delay: 0.42, ease: "power3.out" });
      gsap.to(".hero-art", { y: -10, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, heroRef);
    return () => context.revert();
  }, []);

  const useStyledDefault = !isSwahili && title === DEFAULT_TITLE;

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-[#050706] pb-0 pt-32 text-white sm:pt-40" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-22rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-[#12e4d7]/[0.08] blur-[110px]" />
        <div className="absolute bottom-0 left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#39132f]/45 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-8">
        <div className="hero-reveal inline-flex items-center gap-2 rounded-full border border-[#12e4d7]/20 bg-[#12e4d7]/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#12e4d7]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#12e4d7]" />
          {displayKicker}
        </div>

        <h1 id="hero-heading" className="hero-reveal mx-auto mt-8 max-w-6xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[6rem]">
          {useStyledDefault ? (
            <>
              Most business owners are<br />
              <span className="text-white/[0.32]">flying blind.</span> You don&apos;t have to.
            </>
          ) : displayTitle}
        </h1>

        <p className="hero-reveal mx-auto mt-7 max-w-3xl text-base leading-8 text-white/[0.48] sm:text-lg sm:leading-8">
          {displaySubtitle}
        </p>

        <div className="hero-reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={primaryUrl} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#12e4d7] px-7 py-3.5 text-sm font-bold text-[#051210] shadow-[0_0_40px_rgba(18,228,215,0.18)] hover:-translate-y-0.5 hover:bg-white">
            {displayPrimaryText} <ArrowRight size={16} />
          </Link>
          <a href="#product-tour" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-7 py-3.5 text-sm font-bold text-white/75 hover:border-white/25 hover:bg-white/[0.08] hover:text-white">
            <Play size={15} className="fill-current" /> {isSwahili ? "Tembelea bidhaa" : "Product tour"}
          </a>
        </div>

        <p className="hero-reveal mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white/[0.28]">
          <Check size={14} className="text-[#12e4d7]" /> {displayTrustText}
        </p>

        <div className="hero-art relative mx-auto mt-10 max-w-[1120px] sm:mt-12">
          <div className="pointer-events-none absolute bottom-8 left-1/2 h-36 w-[70%] -translate-x-1/2 rounded-full bg-[#12e4d7]/10 blur-[70px]" />
          <img
            src={imageUrl || "/landing-hero-devices.png"}
            alt={isSwahili ? "Dashibodi ya BizTrack kwenye kompyuta na simu" : "BizTrack dashboard shown on a laptop and mobile phone"}
            className="relative mx-auto h-auto w-full drop-shadow-[0_38px_70px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>
    </section>
  );
}
