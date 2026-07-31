import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  HandCoins,
  Landmark,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getDebtOverview } from "../services/debtApi";
import type { DebtOverview } from "../services/debtApi";
import { formatCurrency } from "../utils/format";

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof TrendingUp; tone: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      <Icon size={18} className={tone} />
      <p className="mt-3 text-xs font-bold uppercase text-ink/40">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

export default function DebtsOverviewPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";
  const [data, setData] = useState<DebtOverview | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDebtOverview()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Debts &amp; Credit Overview</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">Receivables, payables, and collection activity at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/debts/new" className="rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90">Record Debt</Link>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-8 text-center text-sm font-semibold text-ink/45">Loading overview…</div>
      ) : data && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total customer debts" value={formatCurrency(data.totalCustomerDebts, currency)} icon={HandCoins} tone="text-leaf" />
            <StatCard label="Total supplier debts" value={formatCurrency(data.totalSupplierDebts, currency)} icon={Landmark} tone="text-ink" />
            <StatCard label="Customer overdue" value={formatCurrency(data.customerOverdueAmount, currency)} icon={AlertTriangle} tone="text-red-600" />
            <StatCard label="Supplier overdue" value={formatCurrency(data.supplierOverdueAmount, currency)} icon={AlertTriangle} tone="text-red-600" />
            <StatCard label="Collected this month" value={formatCurrency(data.collectedThisMonth, currency)} icon={TrendingUp} tone="text-leaf" />
            <StatCard label="Paid to suppliers this month" value={formatCurrency(data.paidToSuppliersThisMonth, currency)} icon={TrendingDown} tone="text-ink" />
            <StatCard label="Due today" value={String(data.debtsDueToday)} icon={CalendarClock} tone="text-amber-600" />
            <StatCard label="Due within 7 days" value={String(data.debtsDueWithin7Days)} icon={CalendarDays} tone="text-amber-600" />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
              <h2 className="flex items-center gap-2 border-b border-ink/10 px-4 py-3 text-sm font-bold"><ReceiptText size={15} /> Recently recorded payments</h2>
              {data.recentPayments.length === 0 ? (
                <p className="p-7 text-center text-sm font-semibold text-ink/45">No payments recorded yet.</p>
              ) : (
                <div className="divide-y divide-ink/8">
                  {data.recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">{p.party ?? "—"} · {p.debtNumber}</p>
                        <p className="text-xs text-ink/45">{p.paymentDate} · {p.paymentMethod.split("_").join(" ")}</p>
                      </div>
                      <p className="font-extrabold text-leaf">{formatCurrency(p.amount, currency)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex flex-col gap-4">
              <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
                <h2 className="border-b border-ink/10 px-4 py-3 text-sm font-bold">Customers with highest balances</h2>
                {data.topCustomers.length === 0 ? (
                  <p className="p-6 text-center text-sm font-semibold text-ink/45">No outstanding customer debts.</p>
                ) : (
                  <div className="divide-y divide-ink/8">
                    {data.topCustomers.map((c) => (
                      <div key={c.customerId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="font-semibold">{c.name ?? "—"}</span>
                        <span className="font-bold text-red-600">{formatCurrency(c.outstandingBalance, currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
                <h2 className="border-b border-ink/10 px-4 py-3 text-sm font-bold">Suppliers with highest balances</h2>
                {data.topSuppliers.length === 0 ? (
                  <p className="p-6 text-center text-sm font-semibold text-ink/45">No outstanding supplier debts.</p>
                ) : (
                  <div className="divide-y divide-ink/8">
                    {data.topSuppliers.map((s) => (
                      <div key={s.supplierId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="font-semibold">{s.name ?? "—"}</span>
                        <span className="font-bold text-red-600">{formatCurrency(s.outstandingBalance, currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
