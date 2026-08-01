import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  Check,
  CircleDollarSign,
  FileText,
  PackageCheck,
  ReceiptText,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const TOUR_TABS = [
  { label: "Dashboard", icon: BarChart3 },
  { label: "Sales", icon: ReceiptText },
  { label: "Inventory", icon: Boxes },
  { label: "Customers", icon: Users },
  { label: "Reports", icon: FileText },
];

const TOUR_CONTENT = {
  Dashboard: {
    title: "Executive dashboard",
    summary: "Revenue, profit, expenses and cash position — live.",
    cards: [
      ["Revenue", "TZS 12.8M", "+18.4%"],
      ["Net profit", "TZS 4.2M", "+11.2%"],
      ["Expenses", "TZS 8.6M", "-3.1%"],
      ["Cash flow", "TZS 3.7M", "+9.8%"],
    ],
  },
  Sales: {
    title: "Sales command centre",
    summary: "Record sales quickly and know what is selling now.",
    cards: [
      ["Today", "TZS 842K", "+24%"],
      ["Transactions", "128", "+16"],
      ["Average sale", "TZS 65K", "+6.2%"],
      ["Outstanding", "TZS 310K", "12 invoices"],
    ],
  },
  Inventory: {
    title: "Inventory control",
    summary: "Live stock, purchase receiving and low-stock warnings.",
    cards: [
      ["Stock value", "TZS 24.6M", "+7.5%"],
      ["Products", "846", "24 new"],
      ["Low stock", "12", "Needs action"],
      ["Suppliers", "38", "4 active POs"],
    ],
  },
  Customers: {
    title: "Customer relationships",
    summary: "Purchase history, balances and debt records in one profile.",
    cards: [
      ["Customers", "2,418", "+84"],
      ["Repeat buyers", "68%", "+5.4%"],
      ["Receivables", "TZS 6.1M", "42 accounts"],
      ["Reminders", "31", "Automated"],
    ],
  },
  Reports: {
    title: "Automatic reports",
    summary: "Profit, cash flow and inventory reports ready to share.",
    cards: [
      ["Gross margin", "42.8%", "+2.1%"],
      ["Monthly profit", "TZS 4.2M", "+11.2%"],
      ["Reports", "18", "PDF & Excel"],
      ["Branches", "4", "Consolidated"],
    ],
  },
} as const;

const CHART_HEIGHTS = [32, 54, 44, 72, 61, 86, 68, 94, 78, 102, 88, 118];

function SectionHeading({ eyebrow, title, muted }: { eyebrow: string; title: string; muted?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#12e4d7]">{eyebrow}</p>
      <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
        {title} {muted && <span className="text-white/[0.35]">{muted}</span>}
      </h2>
    </div>
  );
}

export function ProductTourSection() {
  const [activeTab, setActiveTab] = useState<keyof typeof TOUR_CONTENT>("Dashboard");
  const active = TOUR_CONTENT[activeTab];

  return (
    <section id="product-tour" className="border-t border-white/5 bg-[#070908] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Product tour" title="See it work." muted="Live." />
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-7 text-white/[0.45]">
          Explore the tools your team uses every day — connected in one operating system.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {TOUR_TABS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(label as keyof typeof TOUR_CONTENT)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === label
                  ? "border-[#12e4d7]/50 bg-[#12e4d7] text-[#051210] shadow-[0_0_30px_rgba(18,228,215,0.16)]"
                  : "border-white/10 bg-white/[0.04] text-white/[0.55] hover:border-white/20 hover:text-white"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d100f] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-2 border-b border-white/[0.08] px-5 py-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6d62]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f4bd4f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#43c06b]" />
            <span className="ml-3 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-1.5 text-[11px] font-medium text-white/[0.35]">
              app.biztrack.co
            </span>
            <span className="ml-auto inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#12e4d7]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#12e4d7]" /> Live
            </span>
          </div>

          <div className="grid min-h-[560px] lg:grid-cols-[210px_1fr]">
            <aside className="hidden border-r border-white/[0.08] p-5 lg:block">
              <img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="h-7 w-auto" />
              <div className="mt-10 space-y-2">
                {TOUR_TABS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setActiveTab(label as keyof typeof TOUR_CONTENT)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold ${
                      activeTab === label ? "bg-white/10 text-white" : "text-white/[0.35] hover:bg-white/[0.04] hover:text-white/[0.65]"
                    }`}
                  >
                    <Icon size={15} className={activeTab === label ? "text-[#12e4d7]" : ""} />
                    {label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="bg-[#f6f7f7] p-5 text-[#151a19] sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#179a85]">Overview</p>
                  <h3 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{active.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{active.summary}</p>
                </div>
                <span className="rounded-full bg-[#dffbf5] px-4 py-2 text-xs font-bold text-[#0d8b74]">Today</span>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {active.cards.map(([label, value, change], index) => (
                  <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                      <span className={`h-2 w-2 rounded-full ${index === 2 ? "bg-rose-400" : "bg-emerald-400"}`} />
                    </div>
                    <p className="mt-4 font-display text-xl font-bold tracking-tight">{value}</p>
                    <p className={`mt-2 text-xs font-semibold ${index === 2 ? "text-rose-500" : "text-emerald-600"}`}>{change}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Performance</p>
                      <p className="mt-1 font-display text-lg font-bold">Revenue trend</p>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">+18.4%</span>
                  </div>
                  <div className="mt-8 flex h-48 items-end gap-2" aria-hidden="true">
                    {CHART_HEIGHTS.map((height, index) => (
                      <span
                        key={index}
                        className={`flex-1 rounded-t-md ${index === CHART_HEIGHTS.length - 1 ? "bg-[#20cfa8]" : "bg-[#d9f6ef]"}`}
                        style={{ height }}
                      />
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coach recommends</p>
                  <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                    <Sparkles size={18} className="text-cyan-600" />
                    <p className="mt-3 text-sm font-bold">Restock your top 3 products</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Demand is trending above the four-week average.</p>
                  </div>
                  <button className="mt-4 w-full rounded-xl bg-[#101514] px-4 py-3 text-xs font-bold text-white">View insight</button>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const AI_ANSWERS: Record<string, string> = {
  "What was my best month?": "June was your strongest month, with TZS 18.4M in revenue and a 41% gross margin.",
  "How much do I owe suppliers?": "You owe TZS 6.8M across 12 supplier accounts. TZS 1.2M is due this week.",
  "Show me my profit trend.": "Profit has grown for three consecutive months, up 22% overall since May.",
};

export function AiCopilotSection() {
  const questions = Object.keys(AI_ANSWERS);
  const [question, setQuestion] = useState(questions[0]);
  const answer = AI_ANSWERS[question];

  return (
    <section id="ai-copilot" className="border-t border-white/5 bg-[#080a09] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#12e4d7]">AI Copilot</p>
          <h2 className="mt-5 max-w-xl font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
            Ask your business <span className="text-white/[0.35]">anything.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/[0.45] sm:text-lg">
            BizTrack reads your sales, expenses, stock and customer activity, then explains what is happening in plain language.
          </p>
          <ul className="mt-8 space-y-4 text-sm font-semibold text-white/[0.65]">
            {["Daily business summaries", "Actionable recommendations", "Answers grounded in your live numbers"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#12e4d7]/10 text-[#12e4d7]"><Check size={14} /></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_35px_100px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="rounded-[1.5rem] border border-white/[0.08] bg-[#101412] p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#12e4d7] text-[#06110f]"><Bot size={22} /></span>
              <div>
                <p className="font-display text-base font-bold text-white">BizTrack Copilot</p>
                <p className="mt-0.5 text-xs text-[#12e4d7]">Connected to your live data</p>
              </div>
            </div>
            <div className="min-h-[210px] py-7">
              <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-white/[0.08] px-4 py-3 text-sm text-white/75">{question}</div>
              <div className="mt-5 flex gap-3">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#12e4d7] text-[#06110f]"><Sparkles size={15} /></span>
                <p className="rounded-2xl rounded-tl-md border border-[#12e4d7]/10 bg-[#12e4d7]/[0.055] px-4 py-3 text-sm leading-7 text-white/70">{answer}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-5">
              {questions.map((item) => (
                <button
                  key={item}
                  onClick={() => setQuestion(item)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold ${question === item ? "border-[#12e4d7]/40 bg-[#12e4d7]/10 text-[#12e4d7]" : "border-white/10 text-white/[0.45] hover:text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const COMPARISON_ROWS = [
  ["Speed", "Manual and paper-based", "Instant and automated"],
  ["Access", "Single device, local files", "Cloud-based, anywhere"],
  ["Security", "Lost ledgers, no backup", "Encrypted, always backed up"],
  ["Devices", "Desktop only", "Phone, tablet and desktop"],
  ["Intelligence", "Guesswork", "AI-powered insights"],
  ["Reporting", "Hours of spreadsheets", "Automatic and real-time"],
];

export function ComparisonSection() {
  return (
    <section id="why-biztrack" className="border-t border-white/5 bg-[#090b0a] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Why BizTrack" title="Built for how Africa" muted="does business." />
        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-400/10 text-rose-300"><X size={19} /></span>
              <h3 className="font-display text-xl font-bold text-white/[0.65]">Traditional tools</h3>
            </div>
            <div className="mt-7 divide-y divide-white/8">
              {COMPARISON_ROWS.map(([label, traditional]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm">
                  <span className="font-semibold text-white/25">{label}</span>
                  <span className="text-white/[0.45]">{traditional}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="relative overflow-hidden rounded-[2rem] border border-[#12e4d7]/25 bg-[#12e4d7]/[0.055] p-6 shadow-[0_0_80px_rgba(18,228,215,0.06)] sm:p-8">
            <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#12e4d7]/10 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#12e4d7] text-[#051210]"><Zap size={19} /></span>
              <h3 className="font-display text-xl font-bold text-white">BizTrack</h3>
            </div>
            <div className="relative mt-7 divide-y divide-white/8">
              {COMPARISON_ROWS.map(([label, , biztrack]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm">
                  <span className="font-semibold text-white/30">{label}</span>
                  <span className="flex items-center gap-2 font-semibold text-white/80"><Check size={15} className="text-[#12e4d7]" />{biztrack}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] lg:grid-cols-4">
          {[
            ["24/7", "Access your business"],
            ["100%", "Cloud based"],
            ["Real time", "Reports and alerts"],
            ["One", "Source of truth"],
          ].map(([value, label]) => (
            <div key={label} className="bg-[#0b0e0c] px-5 py-9 text-center">
              <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/30">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  const email = "info@afrigotech.com";
  const contactCards = useMemo(() => [
    { icon: CircleDollarSign, title: "Start free", text: "Create your workspace and record your first transaction today.", href: "/register", internal: true },
    { icon: PackageCheck, title: "Talk to us", text: "Questions, demos and partnerships — reach a real person.", href: `mailto:${email}`, internal: false },
    { icon: BarChart3, title: "Explore the product", text: "See how dashboard, sales, stock and reporting work together.", href: "#product-tour", internal: false },
  ], []);

  return (
    <section id="contact" className="border-t border-white/5 bg-[#070908] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Get in touch" title="Talk to a" muted="real human." />
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-7 text-white/[0.45]">
          Questions, product demos or partnerships — we are ready to help you build a clearer business.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {contactCards.map(({ icon: Icon, title, text, href, internal }) => {
            const content = (
              <>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#12e4d7]/10 text-[#12e4d7]"><Icon size={20} /></span>
                <h3 className="mt-7 font-display text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-white/40">{text}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#12e4d7]">Continue <ArrowRight size={15} /></span>
              </>
            );
            const classes = "group rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 transition-all hover:-translate-y-1 hover:border-[#12e4d7]/25 hover:bg-white/[0.045]";
            return internal ? <Link key={title} to={href} className={classes}>{content}</Link> : <a key={title} href={href} className={classes}>{content}</a>;
          })}
        </div>
      </div>
    </section>
  );
}
