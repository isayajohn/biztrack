import {
  ArrowLeft,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Plus,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

const summary = [
  { label: "Sales", value: "$248", icon: CircleDollarSign, tone: "bg-mint text-leaf" },
  { label: "Expenses", value: "$71", icon: WalletCards, tone: "bg-orange-50 text-clay" },
  { label: "Profit", value: "$177", icon: BarChart3, tone: "bg-amber-50 text-amber-700" },
];

const activity = [
  { title: "Sold 2 bags of rice", detail: "Sale recorded", amount: "+$34" },
  { title: "Bought cooking oil stock", detail: "Expense recorded", amount: "-$22" },
  { title: "Added 12 tomato crates", detail: "Inventory updated", amount: "12" },
];

function DemoDashboard() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-ink">
      <div className="mx-auto max-w-md px-4 pb-8 pt-4">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-lg border border-ink/10 bg-white shadow-sm"
            aria-label="Back to home"
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink/55">BizTrack Demo</p>
            <h1 className="text-xl font-black">Today</h1>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg bg-leaf text-white shadow-sm"
            aria-label="Add record"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </header>

        <section className="mt-5 rounded-lg bg-ink p-5 text-white shadow-soft">
          <p className="text-sm font-semibold text-white/65">Net profit</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-4xl font-black">$177</p>
            <span className="rounded-lg bg-white/12 px-3 py-2 text-sm font-bold">Good day</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Sales are higher than expenses. Keep watching stock for your fastest
            moving products.
          </p>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-3">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${item.tone}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-semibold text-ink/55">{item.label}</p>
                <p className="text-lg font-black">{item.value}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Quick actions</h2>
            <ReceiptText size={19} className="text-ink/45" aria-hidden="true" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="rounded-lg bg-leaf px-4 py-3 text-sm font-bold text-white">
              Add sale
            </button>
            <button className="rounded-lg border border-ink/10 bg-[#f7faf9] px-4 py-3 text-sm font-bold">
              Add expense
            </button>
            <button className="rounded-lg border border-ink/10 bg-[#f7faf9] px-4 py-3 text-sm font-bold">
              Add product
            </button>
            <button className="rounded-lg border border-ink/10 bg-[#f7faf9] px-4 py-3 text-sm font-bold">
              View reports
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Recent activity</h2>
            <Boxes size={19} className="text-ink/45" aria-hidden="true" />
          </div>
          <div className="mt-2">
            {activity.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between border-t border-ink/10 py-3 first:border-t-0"
              >
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs font-semibold text-ink/50">{item.detail}</p>
                </div>
                <span className="text-sm font-black text-leaf">{item.amount}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default DemoDashboard;
