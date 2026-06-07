import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bot,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Plus,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import StatCard from "../components/dashboard/StatCard";
import { generateBusinessSummary } from "../services/aiApi";
import { getApiErrorMessage, isPackageAccessError } from "../services/apiClient";
import { getExpenses } from "../services/expenseService";
import { getProducts } from "../services/productService";
import { getSales } from "../services/saleService";
import type { Expense } from "../types/expense";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";
import { formatCurrency, getGreeting } from "../utils/format";
import { buildReportData, getDefaultReportRange } from "../utils/reportUtils";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

type TooltipEntry = { name: string; value: number; color: string };

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink/10 bg-white px-3.5 py-3 shadow-soft">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}:{" "}
          <span className="font-extrabold">{formatCurrency(entry.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-ink/40" aria-hidden="true" />}
        <h2 className="text-sm font-bold text-ink">{title}</h2>
      </div>
      {subtitle && <span className="text-xs font-semibold text-ink/40">{subtitle}</span>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message, icon: Icon }: { message: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <Icon size={22} className="text-ink/25" aria-hidden="true" />
      <p className="text-xs font-semibold text-ink/40">{message}</p>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="mt-3 animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1.5">
          <div className="space-y-1.5">
            <div className="h-3 w-32 rounded-full bg-ink/8" />
            <div className="h-2.5 w-20 rounded-full bg-ink/8" />
          </div>
          <div className="h-4 w-12 rounded-full bg-ink/8" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="mt-4 flex animate-pulse items-end gap-1.5" style={{ height: 220 }}>
      {[65, 80, 55, 90, 70, 95, 60].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-ink/8"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ─── Expense category badge ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Stock: "bg-sky-50 text-sky-700",
  Rent: "bg-amber-50 text-amber-700",
  Transport: "bg-purple-50 text-purple-700",
  Utilities: "bg-orange-50 text-clay",
};

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? "bg-[#f4f0e8] text-ink/60";
  return (
    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cls}`}>
      {category}
    </span>
  );
}

// ─── Low stock severity ────────────────────────────────────────────────────────

function StockBadge({ stock, lowStockLevel }: { stock: number; lowStockLevel: number }) {
  if (stock === 0) {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
        Out of stock
      </span>
    );
  }
  if (stock / lowStockLevel < 0.3) {
    return (
      <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-clay">
        Critical
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
      Low
    </span>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiGeneratedAt, setAiGeneratedAt] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryNeedsUpgrade, setSummaryNeedsUpgrade] = useState(false);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    Promise.all([getProducts(), getSales(), getExpenses()])
      .then(([nextProducts, nextSales, nextExpenses]) => {
        if (!alive) return;
        setProducts(nextProducts);
        setSales(nextSales);
        setExpenses(nextExpenses);
      })
      .catch((err) => {
        if (alive) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const currency = user?.currency ?? "USD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const todayReport = buildReportData(products, sales, expenses, getDefaultReportRange("today"));
  const monthReport = buildReportData(products, sales, expenses, getDefaultReportRange("month"));
  const todayProfit = todayReport.summary.netProfit;
  const monthlyProfit = monthReport.summary.netProfit;
  const chartData = monthReport.salesVsExpenses.slice(-7).map((row) => ({
    ...row,
    day: row.label,
  }));
  const lowStockProducts = monthReport.lowStockProducts;
  const recentSales = [...sales]
    .sort((a, b) =>
      a.saleDate !== b.saleDate
        ? b.saleDate.localeCompare(a.saleDate)
        : b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 5);
  const recentExpenses = [...expenses]
    .sort((a, b) =>
      a.expenseDate !== b.expenseDate
        ? b.expenseDate.localeCompare(a.expenseDate)
        : b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 5);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError("");
    setSummaryNeedsUpgrade(false);
    try {
      const result = await generateBusinessSummary();
      setAiSummary(result.summary);
      setAiGeneratedAt(result.generatedAt);
    } catch (err) {
      if (isPackageAccessError(err)) {
        setSummaryNeedsUpgrade(true);
      }
      setSummaryError(getApiErrorMessage(err));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* ── Greeting + Quick actions ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-ink/40">{today}</p>
          <h1 className="mt-0.5 font-display text-xl font-bold text-ink">
            {greeting}, {firstName} 👋
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/sales/new"
            className="flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
          >
            <Plus size={13} aria-hidden="true" />
            Add Sale
          </Link>
          <Link
            to="/expenses/new"
            className="flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
          >
            <Plus size={13} aria-hidden="true" />
            Add Expense
          </Link>
          <Link
            to="/products/new"
            className="flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
          >
            <Plus size={13} aria-hidden="true" />
            Add Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* ── Today at a glance ── */}
      <section className="mt-6" aria-label="Today's summary">
        <SectionHeader title="Today at a glance" icon={BarChart3} />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Sales"
            value={fmt(todayReport.summary.totalSales)}
            icon={CircleDollarSign}
            iconClass="bg-mint text-leaf"
            loading={isLoading}
          />
          <StatCard
            label="Expenses"
            value={fmt(todayReport.summary.totalExpenses)}
            icon={WalletCards}
            iconClass="bg-orange-50 text-clay"
            loading={isLoading}
          />
          <StatCard
            label="Profit"
            value={fmt(todayProfit)}
            icon={todayProfit >= 0 ? TrendingUp : TrendingDown}
            iconClass={todayProfit >= 0 ? "bg-mint text-leaf" : "bg-orange-50 text-clay"}
            loading={isLoading}
            profitColor={todayProfit >= 0 ? "positive" : "negative"}
          />
        </div>
      </section>

      {/* ── AI business summary ── */}
      <section
        className="mt-5 rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
        aria-label="AI business summary"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            title="AI business summary"
            subtitle={aiGeneratedAt ? new Date(aiGeneratedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined}
            icon={Bot}
          />
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bot size={13} aria-hidden="true" />
            {isGeneratingSummary ? "Generating..." : "Generate Summary"}
          </button>
        </div>
        <div className="mt-3 rounded-lg bg-[#f8f6f1] px-3.5 py-3">
          {isGeneratingSummary ? (
            <p className="text-sm font-semibold text-ink/55">Preparing your business summary...</p>
          ) : summaryNeedsUpgrade ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-ink">AI summary needs a paid package.</p>
                <p className="mt-1 text-sm font-semibold text-ink/55">
                  {summaryError} Choose a package and complete payment to unlock AI insights.
                </p>
              </div>
              <Link
                to="/subscription"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
              >
                <CreditCard size={13} aria-hidden="true" />
                Pay package
              </Link>
            </div>
          ) : summaryError ? (
            <p className="text-sm font-semibold text-red-600">{summaryError}</p>
          ) : aiSummary ? (
            <p className="text-sm leading-6 text-ink/75">{aiSummary}</p>
          ) : (
            <p className="text-sm font-semibold text-ink/45">
              Generate a simple summary of today&apos;s sales, expenses, profit, stock, and advice.
            </p>
          )}
        </div>
      </section>

      {/* ── This month ── */}
      <section className="mt-5" aria-label="Monthly summary">
        <SectionHeader title="This month" icon={BarChart3} />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Sales"
            value={fmt(monthReport.summary.totalSales)}
            icon={CircleDollarSign}
            iconClass="bg-sky-50 text-sky-700"
            loading={isLoading}
          />
          <StatCard
            label="Expenses"
            value={fmt(monthReport.summary.totalExpenses)}
            icon={WalletCards}
            iconClass="bg-orange-50 text-clay"
            loading={isLoading}
          />
          <StatCard
            label="Profit"
            value={fmt(monthlyProfit)}
            icon={monthlyProfit >= 0 ? TrendingUp : TrendingDown}
            iconClass={
              monthlyProfit >= 0 ? "bg-amber-50 text-amber-700" : "bg-orange-50 text-clay"
            }
            loading={isLoading}
            profitColor={monthlyProfit >= 0 ? "positive" : "negative"}
          />
        </div>
      </section>

      {/* ── Chart + Low Stock ── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Sales vs Expenses chart */}
        <section
          className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm lg:col-span-2"
          aria-label="Sales vs expenses chart"
        >
          <SectionHeader title="Sales vs Expenses" subtitle="Last 7 days" icon={BarChart3} />
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  barCategoryGap="28%"
                  barGap={3}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(23,33,27,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "rgba(23,33,27,0.45)", fontFamily: "Open Sans" }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(23,33,27,0.45)", fontFamily: "Open Sans" }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip currency={currency} />
                    }
                    cursor={{ fill: "rgba(23,33,27,0.04)", radius: 4 } as object}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 14, fontFamily: "Open Sans" }}
                  />
                  <Bar dataKey="sales" name="Sales" fill="#1f8a5b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#c86b3c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Low stock */}
        <section
          className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
          aria-label="Low stock products"
        >
          <SectionHeader title="Low stock" subtitle={`${lowStockProducts.length} items`} icon={AlertTriangle} />
          {isLoading ? (
            <ListSkeleton />
          ) : lowStockProducts.length === 0 ? (
            <EmptyState message="All products are well stocked." icon={CheckCircle2} />
          ) : (
            <ul className="mt-3 divide-y divide-ink/8" role="list">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                    <p className="text-xs text-ink/45">
                      {p.stock} left
                    </p>
                  </div>
                  <StockBadge stock={p.stock} lowStockLevel={p.lowStockLevel} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Recent Sales + Recent Expenses ── */}
      <div className="mt-5 grid gap-5 pb-2 lg:grid-cols-2">
        {/* Recent Sales */}
        <section
          className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
          aria-label="Recent sales"
        >
          <SectionHeader title="Recent sales" subtitle="Last 5" icon={CircleDollarSign} />
          {isLoading ? (
            <ListSkeleton />
          ) : recentSales.length === 0 ? (
            <EmptyState message="No sales recorded yet." icon={CircleDollarSign} />
          ) : (
            <ul className="mt-3 divide-y divide-ink/8" role="list">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{sale.productName}</p>
                    <p className="text-xs text-ink/45">
                      Qty {sale.quantity} · {sale.saleDate}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-leaf">
                    +{fmt(sale.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Expenses */}
        <section
          className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
          aria-label="Recent expenses"
        >
          <SectionHeader title="Recent expenses" subtitle="Last 5" icon={WalletCards} />
          {isLoading ? (
            <ListSkeleton />
          ) : recentExpenses.length === 0 ? (
            <EmptyState message="No expenses recorded yet." icon={WalletCards} />
          ) : (
            <ul className="mt-3 divide-y divide-ink/8" role="list">
              {recentExpenses.map((exp) => (
                <li key={exp.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{exp.description}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/45">
                      <CategoryBadge category={exp.category} />
                      {exp.expenseDate}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-clay">
                    -{fmt(exp.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
