import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="bg-ink py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-1.5 text-sm font-semibold text-white/70">
          <Sparkles size={14} aria-hidden="true" />
          Free forever on the basic plan
        </span>
        <h2 className="font-display text-3xl font-extrabold text-white sm:text-5xl">
          Start tracking your{" "}
          <span className="text-leaf">business</span> today
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/55">
          Join thousands of small business owners who use BizTrack to understand
          their numbers and grow with confidence.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-leaf px-8 py-3.5 text-base font-bold text-white shadow-soft transition-all hover:bg-leaf/90 hover:shadow-lg hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-white/8 hover:border-white/25"
          >
            View Demo
          </Link>
        </div>
        <p className="mt-5 text-xs font-semibold text-white/30">
          No credit card required · Cancel anytime · Instant setup
        </p>
      </div>
    </section>
  );
}
