import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingLanguage } from "../../i18n/LandingLanguageContext";

type Props = {
  kicker?: string | null;
  title?: string | null;
  description?: string | null;
  primaryText?: string | null;
  primaryUrl?: string | null;
  secondaryText?: string | null;
  secondaryUrl?: string | null;
};

export default function FinalCTA({ kicker, title, description, primaryText, primaryUrl }: Props) {
  const { isSwahili } = useLandingLanguage();
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#070908] py-24 sm:py-32" aria-labelledby="cta-heading">
      <div className="pointer-events-none absolute inset-x-5 inset-y-0 mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#111513]" aria-hidden="true">
        <div className="absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#12e4d7]/20 blur-[120px]" />
        <div className="absolute -bottom-44 -right-28 h-[30rem] w-[30rem] rounded-full bg-[#4a183f]/70 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.13] [background-image:radial-gradient(rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:26px_26px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-8 py-20 text-center sm:px-12 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#12e4d7]">
          <Sparkles size={14} /> {isSwahili ? "Biashara yako inastahili uwazi" : kicker || "Your business deserves clarity"}
        </span>
        <h2 id="cta-heading" className="mx-auto mt-7 max-w-4xl font-display text-4xl font-semibold leading-[1.03] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
          {isSwahili ? <>Uko tayari kubadilisha <span className="text-[#12e4d7]">biashara yako?</span></> : title || <>Ready to transform <span className="text-[#12e4d7]">your business?</span></>}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/[0.45]">
          {isSwahili ? "Jiunge na biashara zinazokua zinazotumia BizTrack kubadilisha makisio kuwa takwimu wazi za wakati halisi." : description || "Join growing businesses that use BizTrack to replace guesswork with clear, live numbers."}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={primaryUrl || "/register"} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#12e4d7] px-7 py-3 text-sm font-bold text-[#051210] hover:-translate-y-0.5 hover:bg-white">
            {isSwahili ? "Anza bure" : primaryText || "Start free"} <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white/75 hover:border-white/25 hover:bg-white/[0.08]">
            {isSwahili ? "Jisajili au ingia" : "Sign up or log in"}
          </Link>
        </div>
      </div>
    </section>
  );
}
