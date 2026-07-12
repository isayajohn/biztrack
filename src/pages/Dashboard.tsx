import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Lightbulb,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import QuickAddDialog from "../components/app/QuickAddDialog";
import { AnimatedIcon } from "../components/animate-ui/MotionPrimitives";
import { generateBusinessSummary } from "../services/aiApi";
import { getApiErrorMessage, isPackageAccessError } from "../services/apiClient";
import { getExpenses } from "../services/expenseService";
import { getProducts } from "../services/productService";
import { getSales } from "../services/saleService";
import type { Expense } from "../types/expense";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";
import { formatCurrency, getGreeting } from "../utils/format";
import { buildReportData, formatDateKey, getDefaultReportRange } from "../utils/reportUtils";

type TooltipEntry = { name: string; value: number; color: string };

const expenseColors = ["#ea580c", "#f59e0b", "#0f766e", "#2563eb", "#7c3aed", "#475569"];

function yesterdayRange() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const key = formatDateKey(date);
  return { preset: "custom" as const, startDate: key, endDate: key };
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatPercent(value: number) {
  const rounded = Math.abs(value) < 0.05 ? 0 : Number(value.toFixed(1));
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatDashboardDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DashboardTooltip({
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
    <div className="rounded-lg border border-ink/10 bg-white px-3 py-2 shadow-soft">
      <p className="mb-1 text-[11px] font-bold text-ink/45">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs font-bold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

function PanelTitle({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon size={15} aria-hidden="true" />
      </span>
      <h2 className="font-display text-sm font-bold text-ink">{title}</h2>
    </div>
  );
}

function Sparkline({ tone = "emerald" }: { tone?: "emerald" | "orange" }) {
  const stroke = tone === "orange" ? "#ea580c" : "#059669";
  const points = tone === "orange" ? "0,24 18,24 36,24 54,24 72,24 90,24" : "0,26 14,18 28,20 42,8 56,18 70,25 84,14 98,20 112,10 126,17";
  return (
    <svg className="h-8 w-32" viewBox="0 0 126 32" aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconClass,
  trend,
  linkLabel,
  linkTo,
  loading,
  sparkTone = "emerald",
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClass: string;
  trend?: number;
  linkLabel?: string;
  linkTo?: string;
  loading?: boolean;
  sparkTone?: "emerald" | "orange";
}) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <section className="min-h-[8.75rem] rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-10 rounded-lg bg-ink/8" />
          <div className="h-4 w-24 rounded-full bg-ink/8" />
          <div className="h-6 w-28 rounded-full bg-ink/8" />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <span className={`grid h-10 w-10 place-items-center rounded-lg ${iconClass}`}>
              <AnimatedIcon icon={Icon} size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink/60">{title}</p>
              <p className="mt-2 font-display text-xl font-bold text-ink">{value}</p>
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-3">
            {trend !== undefined ? (
              <p className={`flex items-center gap-1 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-orange-600"}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatPercent(Math.abs(trend))}
                <span className="font-semibold text-ink/45">from yesterday</span>
              </p>
            ) : linkTo && linkLabel ? (
              <Link to={linkTo} className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:text-emerald-700">
                {linkLabel}
                <ChevronRight size={16} />
              </Link>
            ) : null}
            {trend !== undefined && <Sparkline tone={sparkTone} />}
          </div>
        </>
      )}
    </section>
  );
}

function EmptyBreakdown() {
  return (
    <div className="flex min-h-[13rem] items-center justify-center gap-8">
      <div className="relative grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-ink/5 to-ink/10">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-sm">
          <WalletCards size={28} className="text-ink/75" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">No expenses recorded yet</p>
        <p className="mt-2 text-sm text-ink/50">Add an expense to see the breakdown.</p>
      </div>
    </div>
  );
}

function CardButton({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/70 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
      {children}
    </Link>
  );
}

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

  const currency = user?.currency ?? "TZS";
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const todayReport = useMemo(() => buildReportData(products, sales, expenses, getDefaultReportRange("today")), [products, sales, expenses]);
  const yesterdayReport = useMemo(() => buildReportData(products, sales, expenses, yesterdayRange()), [products, sales, expenses]);
  const monthReport = useMemo(() => buildReportData(products, sales, expenses, getDefaultReportRange("month")), [products, sales, expenses]);
  const chartData = monthReport.salesVsExpenses.slice(-7).map((row) => ({ ...row, day: row.label }));
  const recentSales = [...sales]
    .sort((a, b) => (a.saleDate !== b.saleDate ? b.saleDate.localeCompare(a.saleDate) : b.createdAt.localeCompare(a.createdAt)))
    .slice(0, 3);
  const recentExpenses = [...expenses]
    .sort((a, b) => (a.expenseDate !== b.expenseDate ? b.expenseDate.localeCompare(a.expenseDate) : b.createdAt.localeCompare(a.createdAt)))
    .slice(0, 3);
  const lowStockCount = monthReport.lowStockProducts.length;
  const defaultAiSummary = `Your business is performing well! Sales are ${todayReport.summary.totalSales >= yesterdayReport.summary.totalSales ? "up" : "down"} ${formatPercent(Math.abs(percentChange(todayReport.summary.totalSales, yesterdayReport.summary.totalSales)))} compared to yesterday.`;

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError("");
    setSummaryNeedsUpgrade(false);
    try {
      const result = await generateBusinessSummary();
      setAiSummary(result.summary);
      setAiGeneratedAt(result.generatedAt);
    } catch (err) {
      if (isPackageAccessError(err)) setSummaryNeedsUpgrade(true);
      setSummaryError(getApiErrorMessage(err));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="mx-auto max-w-[94rem] px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-2 text-sm font-semibold text-ink/50">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QuickAddDialog formType="sale" triggerLabel="Add Sale" triggerIconSize={16} triggerClassName="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700" />
          <QuickAddDialog formType="expense" triggerLabel="Add Expense" triggerIconSize={16} triggerClassName="inline-flex h-11 items-center gap-2 rounded-lg border border-ink/10 bg-white px-5 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-emerald-50" />
          <QuickAddDialog formType="product" triggerLabel="Add Product" triggerIconSize={16} triggerClassName="inline-flex h-11 items-center gap-2 rounded-lg border border-ink/10 bg-white px-5 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-emerald-50" />
        </div>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Sales" value={formatCurrency(todayReport.summary.totalSales, currency)} icon={CircleDollarSign} iconClass="bg-emerald-50 text-emerald-700" trend={percentChange(todayReport.summary.totalSales, yesterdayReport.summary.totalSales)} loading={isLoading} />
        <KpiCard title="Total Expenses" value={formatCurrency(todayReport.summary.totalExpenses, currency)} icon={WalletCards} iconClass="bg-orange-50 text-orange-600" trend={percentChange(todayReport.summary.totalExpenses, yesterdayReport.summary.totalExpenses)} loading={isLoading} sparkTone="orange" />
        <KpiCard title="Net Profit" value={formatCurrency(todayReport.summary.netProfit, currency)} icon={ArrowUpRight} iconClass="bg-emerald-50 text-emerald-700" trend={percentChange(todayReport.summary.netProfit, yesterdayReport.summary.netProfit)} loading={isLoading} />
        <KpiCard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} iconClass="bg-amber-50 text-amber-600" linkLabel="View items" linkTo="/products" loading={isLoading} />
      </div>

      <section className="mt-5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="mt-0.5 text-emerald-700"><Sparkles size={18} /></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold text-ink">AI Business Summary</h2>
                {aiGeneratedAt && <span className="text-xs font-semibold text-ink/40">{new Date(aiGeneratedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              </div>
              <p className={`mt-3 text-sm ${summaryError ? "font-semibold text-red-600" : "text-ink/65"}`}>
                {isGeneratingSummary
                  ? "Preparing your business summary..."
                  : summaryNeedsUpgrade
                    ? `${summaryError} Choose a package and complete payment to unlock AI insights.`
                    : summaryError || aiSummary || defaultAiSummary}
              </p>
            </div>
          </div>
          {summaryNeedsUpgrade ? (
            <Link to="/subscription" className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white">Pay package</Link>
          ) : (
            <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-5 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-60">
              <Bot size={16} />
              Generate Summary
            </button>
          )}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <PanelTitle title="Sales vs Expenses" icon={TrendingUp} />
            <button className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/60">Last 7 days</button>
          </div>
          <div className="mt-4 flex gap-6 pl-11 text-xs font-semibold text-ink/55">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-emerald-600" /> Sales</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-orange-600" /> Expenses</span>
          </div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="45%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,35,30,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(16,35,30,0.5)" }} axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis tick={{ fontSize: 12, fill: "rgba(16,35,30,0.5)" }} axisLine={false} tickLine={false} width={42} tickFormatter={(value) => `${Number(value) / 1000}K`} />
                <Tooltip content={<DashboardTooltip currency={currency} />} cursor={{ fill: "rgba(16,185,129,0.08)" } as object} />
                <Bar dataKey="sales" name="Sales" fill="#059669" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ea580c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <PanelTitle title="Expense Breakdown" icon={WalletCards} />
            <button className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/60">This month</button>
          </div>
          {monthReport.expenseByCategory.length === 0 ? (
            <EmptyBreakdown />
          ) : (
            <div className="grid min-h-[13rem] items-center gap-5 md:grid-cols-[13rem_1fr]">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={monthReport.expenseByCategory} innerRadius={58} outerRadius={84} dataKey="value" paddingAngle={2}>
                    {monthReport.expenseByCategory.map((entry, index) => <Cell key={entry.name} fill={expenseColors[index % expenseColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {monthReport.expenseByCategory.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-ink/65"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: expenseColors[index % expenseColors.length] }} />{entry.name}</span>
                    <span className="font-bold text-ink">{formatCurrency(entry.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <PanelTitle title="Recent Sales" icon={CircleDollarSign} />
            <CardButton to="/sales">View all</CardButton>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {recentSales.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-ink/45">No sales recorded yet.</p> : recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{sale.customerName || sale.productName}</p>
                  <p className="mt-1 text-xs font-semibold text-ink/45">{formatDashboardDateTime(sale.createdAt)}</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-emerald-600">+ {formatCurrency(sale.totalAmount, currency)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <PanelTitle title="Recent Expenses" icon={WalletCards} />
            <CardButton to="/expenses">View all</CardButton>
          </div>
          <div className="mt-4 divide-y divide-ink/10">
            {recentExpenses.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-ink/45">No expenses recorded yet.</p> : recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{expense.description}</p>
                  <p className="mt-1 text-xs font-semibold text-ink/45">{formatDashboardDateTime(expense.createdAt)}</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-orange-600">- {formatCurrency(expense.amount, currency)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-white p-5">
        <div className="flex gap-4">
          <Lightbulb size={20} className="mt-0.5 text-amber-500" />
          <div>
            <h2 className="font-display text-sm font-bold text-ink">Tip of the day</h2>
            <p className="mt-3 text-sm text-ink/65">Keep your inventory updated to avoid stockouts and boost sales.</p>
          </div>
        </div>
        <div className="hidden rounded-xl bg-emerald-100 p-3 text-emerald-700 md:block">
          <Plus size={42} />
        </div>
      </section>
    </div>
  );
}
