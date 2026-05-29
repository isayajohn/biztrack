import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Coins,
  ReceiptText,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: ReceiptText,
    title: "Track daily sales",
    text: "Record every sale in seconds and see what is moving today.",
  },
  {
    icon: WalletCards,
    title: "Control expenses",
    text: "Keep rent, stock, transport, and service costs in one simple list.",
  },
  {
    icon: Boxes,
    title: "Know your stock",
    text: "Watch products and inventory before missed sales become a habit.",
  },
  {
    icon: BarChart3,
    title: "Read clear reports",
    text: "Understand profit, cash flow, and product performance without spreadsheets.",
  },
];

const businessTypes = [
  "Small shops",
  "Food sellers",
  "Freelancers",
  "Farmers",
  "Repair shops",
  "Street vendors",
];

function App() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf text-white">
            <Store size={19} aria-hidden="true" />
          </span>
          BizTrack
        </Link>
        <Link
          to="/demo"
          className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm"
        >
          View Demo
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-6 sm:px-6 md:grid-cols-[1fr_0.86fr] md:items-center md:pb-16 md:pt-12">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-mint px-3 py-1 text-sm font-semibold text-leaf">
            <ShieldCheck size={16} aria-hidden="true" />
            Built for everyday business owners
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
            Know your sales, expenses, and profit every day.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
            BizTrack gives small businesses a simple way to record money in,
            money out, stock changes, and profit without complicated accounting
            tools.
          </p>
          <div className="mt-7 grid gap-3 sm:flex">
            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-3 text-base font-bold text-white shadow-soft"
            >
              Get Started Free
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center rounded-lg border border-ink/15 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm"
            >
              View Demo
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink/55">Today</p>
              <h2 className="text-xl font-black">Business snapshot</h2>
            </div>
            <span className="rounded-lg bg-mint px-3 py-2 text-sm font-bold text-leaf">
              +18%
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric icon={Coins} label="Sales" value="$248" tone="bg-mint text-leaf" />
            <Metric
              icon={ReceiptText}
              label="Expenses"
              value="$71"
              tone="bg-orange-50 text-clay"
            />
            <Metric icon={Boxes} label="Items left" value="126" tone="bg-sky-50 text-sky-700" />
            <Metric icon={BarChart3} label="Profit" value="$177" tone="bg-amber-50 text-amber-700" />
          </div>
          <div className="mt-4 rounded-lg bg-[#f4f0e8] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold">Top products</p>
              <ClipboardList size={18} className="text-ink/55" aria-hidden="true" />
            </div>
            {["Rice 5kg", "Phone repair", "Tomato crate"].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between border-t border-ink/10 py-3 first:border-t-0 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-semibold">{item}</span>
                <span className="text-sm font-bold text-leaf">{[42, 18, 12][index]} sold</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white py-8">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 sm:grid-cols-3 sm:px-6">
          {businessTypes.map((type) => (
            <div key={type} className="flex items-center gap-2 rounded-lg bg-[#fbfaf6] p-3">
              <CheckCircle2 size={18} className="text-leaf" aria-hidden="true" />
              <span className="font-semibold">{type}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-clay">What comes first</p>
          <h2 className="mt-2 text-3xl font-black">Simple tools for daily decisions.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-mint text-leaf">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/65">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

type MetricProps = {
  icon: typeof Coins;
  label: string;
  value: string;
  tone: string;
};

function Metric({ icon: Icon, label, value, tone }: MetricProps) {
  return (
    <div className="rounded-lg border border-ink/10 p-3">
      <span className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

export default App;
