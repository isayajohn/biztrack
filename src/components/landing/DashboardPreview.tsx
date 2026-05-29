import {
  BarChart3,
  Boxes,
  Coins,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
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

function LaptopMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="rounded-[1.35rem] border border-slate-300 bg-slate-950 p-2 shadow-[0_26px_70px_rgba(15,23,42,0.26)]">
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="grid min-h-[300px] grid-cols-[72px_1fr] bg-cloud sm:grid-cols-[112px_1fr]">
            <aside className="bg-[#11241d] px-3 py-4 text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/45">BizTrack</p>
              <div className="mt-5 space-y-2">
                {[
                  ["Dashboard", true],
                  ["Sales", false],
                  ["Expenses", false],
                  ["Reports", false],
                ].map(([label, active]) => (
                  <div
                    key={String(label)}
                    className={[
                      "h-8 rounded-lg px-2 text-[10px] font-bold leading-8",
                      active ? "bg-white text-leaf" : "bg-white/0 text-white/50",
                    ].join(" ")}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </aside>

            <main className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-slateMuted">Today</p>
                  <h3 className="font-display text-lg font-extrabold text-ink">Business dashboard</h3>
                </div>
                <span className="rounded-full bg-mint px-2.5 py-1 text-[10px] font-extrabold text-leaf">
                  Live
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {STAT_CARDS.map(({ icon: Icon, label, value, change }) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <Icon size={14} className="text-leaf" aria-hidden="true" />
                    <p className="mt-2 truncate text-[10px] font-bold text-slateMuted">{label}</p>
                    <p className="mt-0.5 text-sm font-extrabold text-ink">{value}</p>
                    <p className="text-[9px] font-bold text-leaf">{change}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slateMuted">Sales trend</p>
                    <TrendingUp size={14} className="text-leaf" aria-hidden="true" />
                  </div>
                  <div className="mt-3 flex h-24 items-end gap-2">
                    {BAR_HEIGHTS.map((height, index) => (
                      <div
                        key={BAR_DAYS[index]}
                        className={["flex-1 rounded-t-md", index === 5 ? "bg-leaf" : "bg-emerald-100"].join(" ")}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slateMuted">Recent activity</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { icon: ShoppingBag, label: "Rice sale", value: "+$34" },
                      { icon: WalletCards, label: "Transport", value: "-$8" },
                      { icon: PackageCheck, label: "Stock update", value: "12" },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-cloud px-2 py-2">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-ink">
                          <Icon size={13} className="text-leaf" aria-hidden="true" />
                          {label}
                        </span>
                        <span className="text-[10px] font-extrabold text-ink">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      <div className="mx-auto h-3 w-[72%] rounded-b-[1.5rem] bg-slate-300 shadow-[0_18px_35px_rgba(15,23,42,0.16)]" />
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto h-[390px] w-[188px] rounded-[2.2rem] bg-slate-950 p-2 shadow-[0_26px_70px_rgba(15,23,42,0.28)]">
      <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-slate-950" />
      <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-[#f4fbf7]">
        <div className="bg-leaf px-4 pb-5 pt-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/55">BizTrack</p>
              <p className="text-[13px] font-bold">Today's overview</p>
            </div>
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15">
              <BarChart3 size={13} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-[10px] font-semibold text-white/60">Today's profit</p>
          <p className="text-3xl font-extrabold">$177</p>
        </div>

        <div className="-mt-4 grid grid-cols-2 gap-2 px-3">
          {[
            ["Sales", "$248", "text-leaf"],
            ["Expenses", "$71", "text-clay"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl bg-white p-3 shadow-card">
              <p className="text-[9px] font-bold text-ink/45">{label}</p>
              <p className={`mt-1 text-base font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mx-3 mt-3 rounded-xl bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-ink/40">Weekly sales</p>
            <span className="text-[9px] font-extrabold text-leaf">+24%</span>
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {BAR_HEIGHTS.map((height, index) => (
              <div
                key={BAR_DAYS[index]}
                className={["flex-1 rounded-t", index === 5 ? "bg-leaf" : "bg-emerald-100"].join(" ")}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="mx-3 mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-extrabold text-clay">
          Low stock: Rice 5kg, Sugar 1kg
        </div>
      </div>
    </div>
  );
}

function DeviceCarousel() {
  return (
    <div className="relative min-h-[430px] w-full overflow-hidden" aria-label="BizTrack dashboard on laptop and phone">
      <div className="mockup-slide absolute inset-x-0 top-0">
        <LaptopMockup />
      </div>
      <div className="mockup-slide mockup-slide-delayed absolute inset-x-0 top-0">
        <PhoneMockup />
      </div>
      <div className="pointer-events-none absolute inset-x-8 bottom-3 h-8 rounded-full bg-leaf/10 blur-2xl" aria-hidden="true" />
    </div>
  );
}

export default function DashboardPreview({ variant = "section" }: DashboardPreviewProps) {
  if (variant === "compact") {
    return (
      <DeviceCarousel />
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

        <LaptopMockup />
      </div>
    </section>
  );
}
