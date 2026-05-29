import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  PackageSearch,
  Printer,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import StatCard from "../components/dashboard/StatCard";
import { getExpenses } from "../services/expenseService";
import { getProducts } from "../services/productService";
import { getSales } from "../services/saleService";
import { getApiErrorMessage } from "../services/apiClient";
import type { Expense } from "../types/expense";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";
import { formatCurrency } from "../utils/format";
import {
  buildReportCsv,
  buildReportData,
  formatReportDate,
  getDefaultReportRange,
} from "../utils/reportUtils";
import type { ProductPerformanceRow, ReportRangePreset } from "../utils/reportUtils";

const RANGE_OPTIONS: { key: ReportRangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Custom" },
];

const PIE_COLORS = ["#1f8a5b", "#c86b3c", "#f8b84e", "#2563eb", "#7c3aed", "#e11d48"];

type TooltipEntry = { name: string; value: number; color: string };
type ReportTableRow = {
  key: string;
  date: string;
  label: string;
  type: "sale" | "expense";
  title: string;
  detail: string;
  paymentMethod: string;
  profit?: number;
  amount: number;
};

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
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-ink/40" aria-hidden="true" />}
        <h2 className="text-sm font-bold text-ink">{title}</h2>
      </div>
      {subtitle && <span className="text-xs font-semibold text-ink/40">{subtitle}</span>}
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon: LucideIcon }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center">
      <Icon size={24} className="text-ink/25" aria-hidden="true" />
      <p className="max-w-xs text-xs font-semibold leading-5 text-ink/45">{message}</p>
    </div>
  );
}

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
      <p className="mb-2 text-[11px] font-bold uppercase text-ink/45">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: <span>{formatCurrency(entry.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

function SimpleTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div className="rounded-xl border border-ink/10 bg-white px-3.5 py-3 shadow-soft">
      <p className="text-sm font-bold text-ink">{entry.name}</p>
      <p className="mt-1 text-sm font-extrabold text-leaf">
        {formatCurrency(entry.value, currency)}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />
      {isEmpty ? (
        <EmptyState message={emptyMessage} icon={icon} />
      ) : (
        <div className="mt-4 h-[260px]">{children}</div>
      )}
    </section>
  );
}

function PerformanceList({
  title,
  rows,
  currency,
  mode,
}: {
  title: string;
  rows: ProductPerformanceRow[];
  currency: string;
  mode: "quantity" | "profit";
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase text-ink/45">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState message="No product activity in this date range." icon={PackageSearch} />
      ) : (
        <div className="mt-3 space-y-2.5">
          {rows.map((row, index) => (
            <div
              key={row.productId}
              className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 bg-[#fbfaf6] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">
                  {index + 1}. {row.productName}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-ink/45">
                  {row.quantitySold} sold · {formatCurrency(row.revenue, currency)} revenue
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold text-leaf">
                {mode === "quantity"
                  ? row.quantitySold
                  : formatCurrency(row.grossProfit, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [range, setRange] = useState(() => getDefaultReportRange("month"));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(10);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError("");
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

  const report = useMemo(
    () => buildReportData(products, sales, expenses, range),
    [products, sales, expenses, range],
  );
  const reportRows = useMemo<ReportTableRow[]>(
    () =>
      report.tableGroups.flatMap((group) =>
        group.items.map((item) => ({
          key: `${group.date}-${item.type}-${item.id}`,
          date: group.date,
          label: group.label,
          type: item.type,
          title: item.title,
          detail: item.detail,
          paymentMethod: item.paymentMethod,
          profit: item.profit,
          amount: item.amount,
        })),
      ),
    [report.tableGroups],
  );
  const paginatedReportRows = useMemo(
    () =>
      reportRows.slice(
        tablePage * tableRowsPerPage,
        tablePage * tableRowsPerPage + tableRowsPerPage,
      ),
    [reportRows, tablePage, tableRowsPerPage],
  );

  useEffect(() => {
    setTablePage(0);
  }, [range, tableRowsPerPage, reportRows.length]);

  const hasTransactions = report.filteredSales.length > 0 || report.filteredExpenses.length > 0;
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const rangeLabel = `${formatReportDate(range.startDate, true)} - ${formatReportDate(
    range.endDate,
    true,
  )}`;

  const handlePresetChange = (preset: ReportRangePreset) => {
    if (preset === "custom") {
      setRange((current) => ({ ...current, preset }));
      return;
    }
    setRange(getDefaultReportRange(preset));
  };

  const handleExportCsv = () => {
    const csv = buildReportCsv(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biztrack-report-${range.startDate}-to-${range.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-ink">Reports</h1>
            <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
              {rangeLabel}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Sales, expenses, profit, and product performance from local records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!hasTransactions}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download size={14} aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-ink/90"
          >
            <Printer size={14} aria-hidden="true" />
            Print report
          </button>
        </div>
      </div>

      <section className="mt-4 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <SectionHeader title="Date range" icon={CalendarDays} />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handlePresetChange(option.key)}
              className={[
                "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                range.preset === option.key
                  ? "bg-ink text-white"
                  : "border border-ink/10 bg-white text-ink/60 hover:bg-[#f4f0e8]",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        {range.preset === "custom" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-ink/55">
              Start date
              <input
                type="date"
                value={range.startDate}
                max={range.endDate}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </label>
            <label className="text-xs font-bold text-ink/55">
              End date
              <input
                type="date"
                value={range.endDate}
                min={range.startDate}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </label>
          </div>
        )}
      </section>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading reports...
        </div>
      )}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-6">
        <StatCard
          label="Total sales"
          value={fmt(report.summary.totalSales)}
          icon={CircleDollarSign}
          iconClass="bg-mint text-leaf"
        />
        <StatCard
          label="Expenses"
          value={fmt(report.summary.totalExpenses)}
          icon={WalletCards}
          iconClass="bg-orange-50 text-clay"
        />
        <StatCard
          label="Gross profit"
          value={fmt(report.summary.grossProfit)}
          icon={TrendingUp}
          iconClass="bg-amber-50 text-amber-700"
          profitColor={report.summary.grossProfit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Net profit"
          value={fmt(report.summary.netProfit)}
          icon={BarChart3}
          iconClass="bg-sky-50 text-sky-700"
          profitColor={report.summary.netProfit >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Sales count"
          value={String(report.summary.numberOfSales)}
          icon={FileText}
          iconClass="bg-[#f4f0e8] text-ink/60"
        />
        <StatCard
          label="Expense count"
          value={String(report.summary.numberOfExpenses)}
          icon={FileText}
          iconClass="bg-[#f4f0e8] text-ink/60"
        />
      </section>

      <section className="mt-4 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <SectionHeader title="Product performance" subtitle="Top 5" icon={PackageSearch} />
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <PerformanceList
            title="Best-selling products"
            rows={report.bestSellingProducts}
            currency={currency}
            mode="quantity"
          />
          <PerformanceList
            title="Most profitable products"
            rows={report.mostProfitableProducts}
            currency={currency}
            mode="profit"
          />
          <div>
            <h3 className="text-xs font-bold uppercase text-ink/45">Low stock products</h3>
            {report.lowStockProducts.length === 0 ? (
              <EmptyState message="No low stock products right now." icon={PackageSearch} />
            ) : (
              <div className="mt-3 space-y-2.5">
                {report.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 bg-[#fbfaf6] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{product.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-ink/45">
                        Alert level: {product.lowStockLevel}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Sales vs expenses"
          subtitle={rangeLabel}
          icon={BarChart3}
          isEmpty={report.salesVsExpenses.length === 0}
          emptyMessage="No sales or expenses found for this date range."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.salesVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#17211b18" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#17211b80" }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#17211b80" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="sales" name="Sales" fill="#1f8a5b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#c86b3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Profit"
          subtitle="Gross and net"
          icon={TrendingUp}
          isEmpty={report.profitChart.length === 0}
          emptyMessage="No profit data found for this date range."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={report.profitChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#17211b18" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#17211b80" }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#17211b80" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Area
                type="monotone"
                dataKey="grossProfit"
                name="Gross profit"
                stroke="#1f8a5b"
                fill="#e9f7ef"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                name="Net profit"
                stroke="#c86b3c"
                fill="#fff7ed"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Expense by category"
          icon={WalletCards}
          isEmpty={report.expenseByCategory.length === 0}
          emptyMessage="No expenses found for this date range."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={report.expenseByCategory} dataKey="value" nameKey="name" outerRadius={86}>
                {report.expenseByCategory.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<SimpleTooltip currency={currency} />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Sales by payment"
          icon={CircleDollarSign}
          isEmpty={report.salesByPaymentMethod.length === 0}
          emptyMessage="No sales found for this date range."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={report.salesByPaymentMethod}
                dataKey="value"
                nameKey="name"
                outerRadius={86}
              >
                {report.salesByPaymentMethod.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<SimpleTooltip currency={currency} />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-4 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <SectionHeader title="Report table" subtitle="Sales and expenses" icon={FileText} />
        {reportRows.length === 0 ? (
          <EmptyState message="No sales or expenses to show in this date range." icon={FileText} />
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-ink/8">
            <TableContainer>
              <Table aria-label="Report transactions table">
                <TableHead>
                  <TableRow className="bg-[#fbfaf6]">
                    <TableCell sx={{ py: 1.25, pl: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Date
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Type
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Title
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Detail
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Payment
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Profit
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, pr: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReportRows.map((item) => (
                    <TableRow key={item.key} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ py: 1.5, pl: 2 }} className="text-sm font-semibold text-ink/60">
                        {item.label}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              item.type === "sale"
                                ? "bg-mint text-leaf"
                                : "bg-orange-50 text-clay",
                            ].join(" ")}
                          >
                            {item.type === "sale" ? "Sale" : "Expense"}
                          </span>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <p className="max-w-[240px] truncate text-sm font-bold text-ink">
                          {item.title}
                        </p>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }} className="text-xs font-semibold text-ink/45">
                        {item.detail}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }} className="text-xs font-semibold text-ink/45">
                        {item.paymentMethod}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }} className="text-xs font-bold text-ink/45">
                        {item.profit !== undefined ? (
                          <span className="text-leaf">{fmt(item.profit)}</span>
                        ) : (
                          <span className="text-ink/30">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ py: 1.5, pr: 2 }}
                        className={[
                          "text-sm font-extrabold",
                          item.type === "sale" ? "text-leaf" : "text-clay",
                        ].join(" ")}
                      >
                        {item.type === "sale" ? "+" : "-"}
                        {fmt(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={reportRows.length}
              page={tablePage}
              onPageChange={(_event, nextPage) => setTablePage(nextPage)}
              rowsPerPage={tableRowsPerPage}
              onRowsPerPageChange={(event) => setTableRowsPerPage(Number(event.target.value))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </div>
        )}
      </section>
    </div>
  );
}
