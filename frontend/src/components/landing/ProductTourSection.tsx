import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  Boxes,
  FileText,
  Landmark,
  ReceiptText,
  Repeat2,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLandingLanguage } from "../../i18n/LandingLanguageContext";

type PanelData = {
  title: string;
  accent: "emerald" | "cyan" | "violet";
  metrics: Array<{ label: string; value: string; trend?: string }>;
  rows: Array<{ left: string; right: string; status?: "ok" | "warn" | "alert" }>;
};

type TourSlide = {
  id: string;
  label: string;
  icon: LucideIcon;
  image?: string;
  caption: string;
  panel?: PanelData;
};

const SLIDES: TourSlide[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, image: "/landing-dashboard.png", caption: "Revenue, profit, and cash flow — live, across every business." },
  {
    id: "pos",
    label: "POS",
    icon: ShoppingCart,
    caption: "Serve customers faster with a simple checkout built for busy counters.",
    panel: {
      title: "Point of Sale",
      accent: "cyan",
      metrics: [
        { label: "Today's sales", value: "TZS 842K", trend: "+18%" },
        { label: "Transactions", value: "128" },
        { label: "Average basket", value: "TZS 65K" },
      ],
      rows: [
        { left: "Quick product search", right: "Ready" },
        { left: "Cash & mobile money", right: "Connected" },
        { left: "Discounts and tax", right: "Automatic" },
        { left: "Receipt", right: "Print or share" },
      ],
    },
  },
  { id: "invoices", label: "Invoices", icon: ReceiptText, image: "/landing-invoices.png", caption: "Send invoices in seconds and watch payment status update in real time." },
  { id: "inventory", label: "Inventory", icon: Boxes, image: "/landing-inventory.png", caption: "Live stock levels with automatic low-stock alerts before you run out." },
  { id: "copilot", label: "AI Copilot", icon: Bot, image: "/landing-copilot.png", caption: "Ask anything about your business and get answers grounded in your data." },
  {
    id: "finance",
    label: "Finance",
    icon: Landmark,
    caption: "A multi-account ledger with live cash flow across every business.",
    panel: {
      title: "Cash position",
      accent: "emerald",
      metrics: [
        { label: "Total cash", value: "TZS 84.2M", trend: "+12.4%" },
        { label: "Inflows (30d)", value: "TZS 42.1M", trend: "+8.1%" },
        { label: "Outflows (30d)", value: "TZS 28.9M", trend: "-3.2%" },
      ],
      rows: [
        { left: "Mobile money", right: "TZS 31.4M" },
        { left: "Business bank account", right: "TZS 38.9M" },
        { left: "Petty cash", right: "TZS 1.9M", status: "warn" },
        { left: "USD reserve", right: "$5,012" },
      ],
    },
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    caption: "One profile per relationship — purchase history, balances, and insights.",
    panel: {
      title: "Top customers",
      accent: "cyan",
      metrics: [
        { label: "Active", value: "1,284", trend: "+46" },
        { label: "Outstanding debt", value: "TZS 12.4M" },
        { label: "Average order", value: "TZS 318K" },
      ],
      rows: [
        { left: "Zanzibar Retail", right: "TZS 8.2M LTV" },
        { left: "Kilimanjaro Foods", right: "TZS 5.6M LTV" },
        { left: "Coastal Logistics", right: "TZS 2.1M due · 38d", status: "alert" },
        { left: "Kitenge Studio", right: "TZS 4.9M LTV" },
      ],
    },
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    caption: "Profit, cash flow, and expense breakdowns — generated automatically.",
    panel: {
      title: "Monthly profit & loss",
      accent: "emerald",
      metrics: [
        { label: "Revenue", value: "TZS 48.2M", trend: "+22%" },
        { label: "Cost of goods", value: "TZS 19.1M" },
        { label: "Net profit", value: "TZS 14.8M", trend: "+14%" },
      ],
      rows: [
        { left: "Gross margin", right: "60.3%" },
        { left: "Operating expenses", right: "TZS 14.2M" },
        { left: "Marketing spend", right: "TZS 3.2M", status: "warn" },
        { left: "Cash flow", right: "Positive every week" },
      ],
    },
  },
  {
    id: "automations",
    label: "Automations",
    icon: Repeat2,
    caption: "Recurring reminders and alerts that keep running in the background.",
    panel: {
      title: "Active workflows",
      accent: "violet",
      metrics: [
        { label: "Active rules", value: "12" },
        { label: "Runs (30d)", value: "486" },
        { label: "Hours saved", value: "38h" },
      ],
      rows: [
        { left: "Customer debt reminders", right: "Email + SMS" },
        { left: "Supplier payment alerts", right: "3 days before due" },
        { left: "Low-stock alerts", right: "8 products watched", status: "warn" },
        { left: "Weekly profit email", right: "Every Monday 7am" },
      ],
    },
  },
];

const ACCENTS = {
  emerald: { bar: "from-emerald-400 to-teal-300", chip: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" },
  cyan: { bar: "from-cyan-400 to-emerald-300", chip: "border-cyan-400/30 bg-cyan-500/15 text-cyan-300" },
  violet: { bar: "from-violet-400 to-fuchsia-400", chip: "border-violet-400/30 bg-violet-500/15 text-violet-200" },
};

function LivePanel({ panel }: { panel: PanelData }) {
  const accent = ACCENTS[panel.accent];
  const statusColor = { ok: "bg-emerald-400", warn: "bg-amber-400", alert: "bg-red-400" };

  return (
    <div className="absolute inset-0 flex flex-col gap-5 overflow-hidden p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Live preview</p>
          <h3 className="mt-1 font-display text-xl font-bold text-white">{panel.title}</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${accent.chip}`}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> syncing
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {panel.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
            <p className="truncate text-[9px] font-bold uppercase tracking-wider text-white/35 sm:text-[10px]">{metric.label}</p>
            <p className="mt-1 truncate text-sm font-bold text-white sm:text-lg">{metric.value}</p>
            {metric.trend && <p className="mt-1 text-[10px] font-semibold text-emerald-300">{metric.trend}</p>}
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        {panel.rows.map((row) => (
          <div key={row.left} className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 last:border-0 sm:py-4">
            <span className="flex min-w-0 items-center gap-3 text-sm text-white/75">
              <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor[row.status || "ok"]}`} />
              <span className="truncate">{row.left}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-white/85 sm:text-sm">{row.right}</span>
          </div>
        ))}
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${accent.bar}`} />
    </div>
  );
}

export default function ProductTourSection() {
  const { isSwahili } = useLandingLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swLabels: Record<string, [string, string]> = {
    dashboard: ["Dashibodi", "Mapato, faida na mtiririko wa fedha — moja kwa moja katika kila biashara."],
    pos: ["POS", "Hudumia wateja haraka kwa sehemu rahisi ya malipo iliyoundwa kwa kaunta zenye shughuli nyingi."],
    invoices: ["Ankara", "Tuma ankara kwa sekunde na fuatilia hali ya malipo papo hapo."],
    inventory: ["Stoo", "Kiasi cha bidhaa moja kwa moja na tahadhari kabla bidhaa hazijaisha."],
    copilot: ["Msaidizi wa AI", "Uliza kuhusu biashara yako na upate majibu yanayotegemea takwimu zako."],
    finance: ["Fedha", "Daftari la akaunti nyingi lenye mtiririko wa fedha wa moja kwa moja."],
    customers: ["Wateja", "Wasifu mmoja kwa kila mteja — historia, salio na uchambuzi."],
    reports: ["Ripoti", "Faida, mtiririko wa fedha na matumizi — vinatengenezwa kiotomatiki."],
    automations: ["Otomatiki", "Vikumbusho na tahadhari zinazoendelea kufanya kazi bila usimamizi wako."],
  };
  const slides = useMemo(() => isSwahili ? SLIDES.map((slide) => ({ ...slide, label: swLabels[slide.id]?.[0] || slide.label, caption: swLabels[slide.id]?.[1] || slide.caption })) : SLIDES, [isSwahili]);
  const active = slides[activeIndex];

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % slides.length), 5200);
    return () => window.clearTimeout(timer);
  }, [activeIndex, paused, slides.length]);

  const activePosition = useMemo(() => `${((activeIndex + 1) / slides.length) * 100}%`, [activeIndex, slides.length]);

  return (
    <section id="product-tour" className="relative bg-[#080b17] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.055] px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="text-sm">✣</span> {isSwahili ? "Tembelea Bidhaa" : "Product Tour"}
          </span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            {isSwahili ? <>Ione ikifanya kazi. <span className="text-white/45">Moja kwa moja.</span></> : <>See it work. <span className="text-white/45">Live.</span></>}
          </h2>
          <p className="mt-6 text-base text-white/55 sm:text-lg">{isSwahili ? "Kila sehemu ya BizTrack — elekeza kipanya kusimamisha, bofya kuchunguza." : "Every module in BizTrack — hover to pause, click to explore."}</p>
        </div>

        <div className="mt-12 flex justify-center">
          <div role="tablist" className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              const selected = index === activeIndex;
              return (
                <button
                  key={slide.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveIndex(index)}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${selected ? "bg-emerald-400 text-[#031b12] shadow-[0_8px_30px_-6px_rgba(16,185,129,0.6)]" : "text-white/65 hover:bg-white/[0.04] hover:text-white"}`}
                >
                  <Icon size={14} /> {slide.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="relative mx-auto mt-12 max-w-5xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="pointer-events-none absolute -inset-10 rounded-[44px] bg-gradient-to-tr from-emerald-500/30 via-cyan-500/15 to-transparent blur-3xl" />
          <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0a0f1e]/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[10px] font-mono text-white/35">app.biztrack.co</span>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0f1e]">
              <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" /><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-300" /></span>
                LIVE
              </span>
              <div key={active.id} className="animate-tour-slide absolute inset-0">
                {active.image ? <img src={active.image} alt={`${active.label} preview`} className="h-full w-full object-cover" /> : active.panel ? <LivePanel panel={active.panel} /> : null}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0f1e] to-transparent" />
            </div>
          </div>
          {!paused && <div key={`progress-${active.id}`} className="animate-tour-progress absolute -bottom-2 left-6 right-6 h-0.5 origin-left rounded-full bg-gradient-to-r from-emerald-400/80 via-cyan-300/60 to-transparent" />}
          <p key={`caption-${active.id}`} className="animate-fade-up mt-8 text-center text-sm text-white/60 sm:text-base">{active.caption}</p>
          <div className="mt-5 flex justify-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`${isSwahili ? "Nenda" : "Go to"} ${slide.label}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? "w-8 bg-emerald-400" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
          <span className="sr-only">Slide progress {activePosition}</span>
        </div>
      </div>
    </section>
  );
}
