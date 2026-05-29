import { Package, ClipboardList, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Package,
    title: "Add your products",
    description:
      "Set up your product catalogue with names, prices, and stock quantities. Takes less than 5 minutes.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Record sales and expenses",
    description:
      "Tap to record every sale and expense throughout the day. Quick, simple, and works offline.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "See your profit instantly",
    description:
      "BizTrack calculates your profit in real time. Know exactly how your business performed today.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#f0faf5] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-leaf">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-base leading-7 text-ink/60">
            No training needed. BizTrack is designed to be simple enough that anyone
            can start using it immediately.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 lg:grid-cols-3">
          {/* Connecting line (desktop only) */}
          <div
            className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-leaf/30 to-transparent lg:block"
            aria-hidden="true"
          />

          {steps.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative flex flex-col items-start">
              {/* Step circle */}
              <div className="relative mb-5 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-white shadow-md font-display text-sm font-bold">
                  {number}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-leaf/15 text-leaf shadow-sm">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-ink/60">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
