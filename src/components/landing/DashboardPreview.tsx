import { BarChart3, Boxes, Coins, ReceiptText, TrendingUp } from "lucide-react";
import { SectionHeader, StatCard } from "./LandingDesignSystem";

const BAR_HEIGHTS = [40, 65, 50, 80, 60, 90, 75];
const BAR_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STAT_CARDS = [
  { icon: Coins, label: "Total Revenue", value: "$12,480", change: "+14%" },
  { icon: ReceiptText, label: "Expenses", value: "$3,210", change: "-5%" },
  { icon: Boxes, label: "Products tracked", value: "84", change: "+6" },
  { icon: BarChart3, label: "Net Profit", value: "$9,270", change: "+22%" },
];

type DashboardPreviewProps = {
  variant?: "section" | "compact";
};

function DashboardMock({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-slate-200 bg-cloud shadow-soft",
        compact && "bg-white/90",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-2 truncate text-xs font-semibold text-slateMuted sm:ml-3">
          app.biztrack.co · Dashboard
        </span>
      </div>

      <div className={compact ? "p-4 sm:p-5" : "p-5 sm:p-7"}>
        <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 md:grid-cols-4"}>
          {STAT_CARDS.map(({ icon, label, value, change }) => (
            <StatCard key={label} icon={icon} label={label} value={value} change={`${change} this month`} />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slateMuted">
                Weekly sales
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink">
                Revenue this week
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-mint px-2.5 py-1.5 ring-1 ring-emerald-100">
              <TrendingUp size={14} className="text-leaf" aria-hidden="true" />
              <span className="text-xs font-bold text-leaf">Up 18%</span>
            </div>
          </div>

          <div className="flex items-end gap-2" aria-hidden="true">
            {BAR_HEIGHTS.map((height, i) => (
              <div key={BAR_DAYS[i]} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={[
                    "animate-bar w-full rounded-t-md transition-all",
                    i === 5 ? "bg-leaf" : "bg-emerald-100",
                  ].join(" ")}
                  style={{ height: `${compact ? Math.max(28, height - 18) : height}px` }}
                />
                <span className="text-[10px] font-semibold text-slateMuted">
                  {BAR_DAYS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPreview({ variant = "section" }: DashboardPreviewProps) {
  if (variant === "compact") {
    return (
      <div aria-label="BizTrack dashboard preview">
        <DashboardMock compact />
      </div>
    );
  }

  return (
    <section id="dashboard-preview" className="scroll-mt-24 bg-white py-14 md:py-20" aria-labelledby="preview-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          id="preview-heading"
          eyebrow="See it in action"
          title="Your entire business at a glance."
          description="One clean dashboard replaces the notebooks, spreadsheets, and guesswork."
          align="center"
        />

        <DashboardMock />
      </div>
    </section>
  );
}
