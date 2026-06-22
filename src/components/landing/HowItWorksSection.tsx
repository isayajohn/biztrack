import { ClipboardList, Package, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "./LandingDesignSystem";

type Props = {
  content?: Record<string, unknown> | null;
};

function textFrom(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

type Step = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const ICON_SEQUENCE: LucideIcon[] = [Package, ClipboardList, TrendingUp];

const DEFAULT_STEPS: Step[] = [
  {
    number: "01",
    icon: Package,
    title: "Add your products",
    description:
      "Set up your product catalogue with names, prices, and stock quantities. Takes less than 5 minutes to get going.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Record sales and expenses",
    description:
      "Tap to record every sale and expense throughout the day. Quick, simple, and works on any device.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "See your profit instantly",
    description:
      "BizTrack calculates your profit in real time. Know exactly how your business performed — every day.",
  },
];

export default function HowItWorksSection({ content }: Props) {
  const record = content && typeof content === "object" && !Array.isArray(content) ? content : null;

  const eyebrow = textFrom(record?.eyebrow) || "How it works";
  const title = textFrom(record?.title) || "Up and running in minutes";
  const description = textFrom(record?.description) ||
    "No training needed. BizTrack is designed to be simple enough that anyone can start using it immediately.";

  const rawSteps = Array.isArray(record?.steps)
    ? (record!.steps as Array<Record<string, unknown>>)
        .map((step, index) => {
          const stepTitle = textFrom(step.title);
          if (!stepTitle) return null;
          return {
            number: textFrom(step.number) || String(index + 1).padStart(2, "0"),
            icon: ICON_SEQUENCE[index % ICON_SEQUENCE.length],
            title: stepTitle,
            description: textFrom(step.description),
          } satisfies Step;
        })
        .filter((step): step is Step => step !== null)
    : [];

  const steps = rawSteps.length ? rawSteps : DEFAULT_STEPS;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-white py-16 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          id="how-it-works-heading"
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
        />

        <div className="relative">
          <div
            className="absolute left-8 right-8 top-24 hidden h-px bg-gradient-to-r from-transparent via-leaf/25 to-transparent lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title: stepTitle, description: stepDescription }) => (
              <article
                key={number}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-cloud p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-card"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_65%)]"
                  aria-hidden="true"
                />

                <div className="relative flex min-h-32 items-center justify-center">
                  <div className="absolute h-28 w-28 rounded-full border border-leaf/10" aria-hidden="true" />
                  <div className="absolute h-20 w-20 rounded-full border border-leaf/15" aria-hidden="true" />
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-leaf text-white shadow-card ring-8 ring-emerald-100/80 transition-transform duration-200 group-hover:scale-105">
                    <Icon size={27} aria-hidden="true" />
                  </span>
                </div>

                <div className="relative mt-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-leaf">
                    Step {number}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-extrabold text-ink">{stepTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-slateMuted">{stepDescription}</p>
                </div>

                <span
                  className="absolute right-5 top-5 font-display text-5xl font-extrabold text-leaf/[0.07]"
                  aria-hidden="true"
                >
                  {number}
                </span>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-100 bg-mint px-4 py-2 text-sm font-bold text-leaf">
              <span className="h-2 w-2 rounded-full bg-leaf" aria-hidden="true" />
              Setup takes minutes, then your daily numbers stay organized automatically.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
