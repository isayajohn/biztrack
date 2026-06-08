import { XCircle } from "lucide-react";

const problems = [
  {
    quote: "I don't know if I made profit today",
    detail: "Without tracking, it's impossible to tell if your business is actually growing.",
  },
  {
    quote: "I forget expenses",
    detail: "Small costs add up fast. Forgetting them means you never see the real picture.",
  },
  {
    quote: "I lose sales records",
    detail: "Paper records get lost, damaged, or forgotten. Your data should be safe and searchable.",
  },
  {
    quote: "I don't know when stock is low",
    detail: "Running out of products means losing customers — and you might not even notice until it's too late.",
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-ink py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-300">
            Sound familiar?
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Running a business blind is stressful
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Most small business owners face the same problems every day. BizTrack
            solves all of them in one place.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(({ quote, detail }) => (
            <article
              key={quote}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
                <XCircle size={20} aria-hidden="true" />
              </span>
              <p className="text-base font-bold italic text-white/90">
                "{quote}"
              </p>
              <p className="mt-3 text-sm leading-6 text-white/50">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
