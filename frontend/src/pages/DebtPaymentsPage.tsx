import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, Sheet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getDebtPayments } from "../services/debtApi";
import type { DebtPaymentLedgerRow, DebtPaymentMethod, DebtType } from "../services/debtApi";
import { exportTableCsv, exportTableExcel, exportTablePdf } from "../utils/exportUtils";
import { formatCurrency } from "../utils/format";

const LIMIT = 25;
const METHODS: DebtPaymentMethod[] = ["CASH", "MOBILE_MONEY", "BANK", "OTHER"];

export default function DebtPaymentsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";
  const [payments, setPayments] = useState<DebtPaymentLedgerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [type, setType] = useState<DebtType | "">("");
  const [paymentMethod, setPaymentMethod] = useState<DebtPaymentMethod | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = useMemo(
    () => ({ page, limit: LIMIT, type: type || undefined, paymentMethod: paymentMethod || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    [page, type, paymentMethod, dateFrom, dateTo],
  );

  useEffect(() => {
    setIsLoading(true);
    setError("");
    getDebtPayments(filters)
      .then((data) => {
        setPayments(data.payments);
        setTotal(data.total);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [filters]);

  const columns = [
    { header: "Date", value: (row: DebtPaymentLedgerRow) => row.paymentDate },
    { header: "Debt #", value: (row: DebtPaymentLedgerRow) => row.debtNumber ?? "" },
    { header: "Type", value: (row: DebtPaymentLedgerRow) => row.debtType ?? "" },
    { header: "Party", value: (row: DebtPaymentLedgerRow) => row.party ?? "" },
    { header: "Amount", value: (row: DebtPaymentLedgerRow) => row.amount },
    { header: "Method", value: (row: DebtPaymentLedgerRow) => row.paymentMethod },
    { header: "Reference", value: (row: DebtPaymentLedgerRow) => row.transactionReference ?? "" },
    { header: "Status", value: (row: DebtPaymentLedgerRow) => (row.isReversed ? "Reversed" : "Recorded") },
  ];
  const pdf = () => payments.length && exportTablePdf({ title: "Debt Payments", fileName: "debt-payments.pdf", columns, rows: payments });
  const excel = () => payments.length ? exportTableExcel({ sheetName: "Debt Payments", fileName: "debt-payments.xlsx", columns, rows: payments }) : undefined;
  const csv = () => payments.length && exportTableCsv({ fileName: "debt-payments.csv", columns, rows: payments });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const resetPage = (setter: () => void) => { setter(); setPage(1); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Debt Payments</h1>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-0.5 text-xs font-bold text-ink/60">{total}</span>
        </div>
        <div className="flex gap-2">
          <button disabled={!payments.length} onClick={pdf} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><FileDown size={14} /> PDF</button>
          <button disabled={!payments.length} onClick={() => csv()} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><FileDown size={14} /> CSV</button>
          <button disabled={!payments.length} onClick={() => void excel()} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><Sheet size={14} /> Excel</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">Debt type
          <select value={type} onChange={(e) => resetPage(() => setType(e.target.value as DebtType | ""))} className="w-40 rounded-xl border border-ink/15 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUPPLIER">Supplier</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">Method
          <select value={paymentMethod} onChange={(e) => resetPage(() => setPaymentMethod(e.target.value as DebtPaymentMethod | ""))} className="w-40 rounded-xl border border-ink/15 px-3 py-2 text-sm">
            <option value="">All</option>
            {METHODS.map((m) => <option key={m} value={m}>{m.split("_").join(" ")}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">From<input type="date" value={dateFrom} onChange={(e) => resetPage(() => setDateFrom(e.target.value))} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">To<input type="date" value={dateTo} onChange={(e) => resetPage(() => setDateTo(e.target.value))} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-8 text-center text-sm font-semibold text-ink/45">Loading payments…</div>
      ) : payments.length === 0 ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-10 text-center text-sm font-semibold text-ink/45">No payments match these filters.</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-[#f7faf9] text-xs uppercase text-ink/45">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Debt #</th>
                  <th className="px-4 py-3">Party</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {payments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-[#f7faf9]">
                    <td className="px-4 py-3">{p.paymentDate}</td>
                    <td className="px-4 py-3"><Link to={`/debts/${p.debtId}`} className="font-bold text-leaf hover:underline">{p.debtNumber}</Link></td>
                    <td className="px-4 py-3">{p.party ?? "—"}</td>
                    <td className={`px-4 py-3 text-right font-bold ${p.isReversed ? "text-ink/30 line-through" : "text-leaf"}`}>{formatCurrency(p.amount, currency)}</td>
                    <td className="px-4 py-3">{p.paymentMethod.split("_").join(" ")}</td>
                    <td className="px-4 py-3 text-ink/60">{p.transactionReference ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.isReversed ? "bg-red-50 text-red-600" : "bg-mint text-leaf"}`}>{p.isReversed ? "Reversed" : "Recorded"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-ink/8 px-4 py-3 text-xs font-semibold text-ink/50">
            <span>Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
