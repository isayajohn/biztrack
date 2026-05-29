import { BarChart3, Boxes, CheckCircle2, ReceiptText, WalletCards } from "lucide-react";
import { SectionHeader } from "./LandingDesignSystem";

const SOLUTION_ROWS = [
  {
    eyebrow: "Money in",
    title: "Know exactly what you earned today.",
    description:
      "Record every sale in seconds from your phone. See today's total, your best-selling products, and how this week compares to last — all without touching a spreadsheet.",
    bullets: [
      "One-tap sale recording",
      "Daily and weekly totals at a glance",
      "See top-selling products instantly",
    ],
    icon: ReceiptText,
    visual: {
      label: "Today's sales",
      value: "$248",
      badge: "+12% vs yesterday",
      tone: "bg-mint text-leaf",
      barTone: "#0f766e",
      lightBarTone: "#ccfbf1",
    },
    reverse: false,
  },
  {
    eyebrow: "Money out",
    title: "Every expense, in one place.",
    description:
      "Stop forgetting small costs that eat your profit. BizTrack lets you log rent, transport, supplies, and any other expense in seconds so the real picture is always visible.",
    bullets: [
      "Categorised expense logging",
      "Monthly expense summaries",
      "See what's eating your profit",
    ],
    icon: WalletCards,
    visual: {
      label: "This month's expenses",
      value: "$1,840",
      badge: "3 categories",
      tone: "bg-mint text-leaf",
      barTone: "#0f766e",
      lightBarTone: "#ccfbf1",
    },
    reverse: true,
  },
  {
    eyebrow: "Stock & reports",
    title: "Never run out of stock unexpectedly.",
    description:
      "Add your products, set stock quantities, and let BizTrack watch them for you. Get low-stock alerts and monthly profit reports so you can make smarter buying decisions.",
    bullets: [
      "Track stock levels automatically as you sell",
      "Low-stock alerts before you run out",
      "Monthly profit and product reports",
    ],
    icon: Boxes,
    visual: {
      label: "Net profit this month",
      value: "$9,270",
      badge: "+22% vs last month",
      tone: "bg-mint text-leaf",
      barTone: "#0f766e",
      lightBarTone: "#ccfbf1",
    },
    reverse: false,
  },
];

const MINI_BARS = [40, 65, 50, 80, 60, 90, 75];

function VisualCard({
  label,
  value,
  badge,
  tone,
  barTone,
  lightBarTone,
  icon: Icon,
}: {
  label: string;
  value: string;
  badge: string;
  tone: string;
  barTone: string;
  lightBarTone: string;
  icon: typeof ReceiptText;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone} ring-1 ring-emerald-100`}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${tone}`}>{badge}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-ink/45">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</p>
      {/* Mini bar chart */}
      <div className="mt-4 flex items-end gap-1" aria-hidden="true">
        {MINI_BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h * 0.4}px`,
              backgroundColor: i === 5 ? barTone : lightBarTone,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SolutionSection() {
  return (
    <section
      className="bg-white py-14 md:py-20"
      aria-labelledby="solution-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          id="solution-heading"
          eyebrow="The solution"
          title="BizTrack gives you the full picture."
          description="In under a minute a day, know exactly where your business stands: sales, expenses, stock, and profit, all in one place."
          align="center"
        />

        {/* Alternating rows */}
        <div className="flex flex-col gap-16">
          {SOLUTION_ROWS.map(({ eyebrow, title, description, bullets, icon, visual, reverse }) => (
            <div
              key={title}
              className={`grid items-center gap-10 md:grid-cols-2 ${
                reverse ? "md:[&>*:first-child]:order-last" : ""
              }`}
            >
              {/* Text side */}
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-leaf">
                  {eyebrow}
                </p>
                <h3 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
                  {title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slateMuted">{description}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-leaf"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-slate-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual side */}
              <VisualCard
                label={visual.label}
                value={visual.value}
                badge={visual.badge}
                tone={visual.tone}
                barTone={visual.barTone}
                lightBarTone={visual.lightBarTone}
                icon={icon}
              />
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 border-t border-slate-200 pt-10">
          {[
            { icon: ReceiptText, text: "Sales tracking" },
            { icon: WalletCards, text: "Expense tracking" },
            { icon: Boxes, text: "Stock management" },
            { icon: BarChart3, text: "Profit reports" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm font-semibold text-slateMuted">
              <Icon size={16} className="text-leaf" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
