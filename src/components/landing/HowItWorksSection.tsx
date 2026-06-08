import { ClipboardList, Package, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "./LandingDesignSystem";

export type HowItWorksStep = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const HOW_IT_WORKS: HowItWorksStep[] = [
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

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-cloud py-14 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          id="how-it-works-heading"
          eyebrow="How it works"
          title="Up and running in minutes"
          description="No training needed. BizTrack is designed to be simple enough that anyone can start using it immediately."
          align="center"
        />

        {/* Steps */}
        <div className="relative grid gap-10 lg:grid-cols-3">
          {/* Connecting line — desktop only */}
          <div
            className="absolute left-0 right-0 top-11 hidden h-px bg-gradient-to-r from-transparent via-leaf/30 to-transparent lg:block"
            aria-hidden="true"
          />

          {HOW_IT_WORKS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative flex flex-col items-start">
              {/* Step circle + icon */}
              <div className="relative mb-5 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf font-display text-sm font-bold text-white shadow-sm">
                  {number}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-100 bg-white text-leaf shadow-sm">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-slateMuted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
