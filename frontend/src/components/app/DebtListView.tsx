import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, Search, Sheet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  DEBT_STATUS_LABELS,
  OVERDUE_PERIOD_LABELS,
  getDebts,
} from "../../services/debtApi";
import type { Debt, DebtListFilters, DebtStatus, DebtType, OverduePeriod } from "../../services/debtApi";
import { exportTableCsv, exportTableExcel, exportTablePdf } from "../../utils/exportUtils";
import { formatCurrency } from "../../utils/format";

const STATUSES = Object.keys(DEBT_STATUS_LABELS) as DebtStatus[];
const OVERDUE_PERIODS = Object.keys(OVERDUE_PERIOD_LABELS) as OverduePeriod[];
const LIMIT = 20;

function StatusBadge({ status }: { status: DebtStatus }) {
  const tone: Record<DebtStatus, string> = {
    DRAFT: "bg-[#eef8f4] text-ink/50",
    ACTIVE: "bg-mint text-leaf",
    PARTIALLY_PAID: "bg-amber-50 text-amber-700",
    OVERDUE: "bg-red-50 text-red-600",
    PAID: "bg-mint text-leaf",
    DISPUTED: "bg-purple-50 text-purple-700",
    WRITTEN_OFF: "bg-ink/10 text-ink/50",
    CANCELLED: "bg-ink/10 text-ink/40",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone[status]}`}>{DEBT_STATUS_LABELS[status]}</span>;
}

export default function DebtListView({
  type,
  parties,
  partyLabel,
}: {
  type: DebtType;
  parties: { id: string; name: string }[];
  partyLabel: string;
}) {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";
  const [debts, setDebts] = useState<Debt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [partyId, setPartyId] = useState("");
  const [status, setStatus] = useState<DebtStatus | "">("");
  const [overduePeriod, setOverduePeriod] = useState<OverduePeriod | "">("");
  const [debtDateFrom, setDebtDateFrom] = useState("");
  const [debtDateTo, setDebtDateTo] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");

  const filters = useMemo<DebtListFilters>(
    () => ({
      type,
      page,
      limit: LIMIT,
      search: search || undefined,
      customerId: type === "CUSTOMER" && partyId ? partyId : undefined,
      supplierId: type === "SUPPLIER" && partyId ? partyId : undefined,
      status: status || undefined,
      overduePeriod: overduePeriod || undefined,
      debtDateFrom: debtDateFrom || undefined,
      debtDateTo: debtDateTo || undefined,
      dueDateFrom: dueDateFrom || undefined,
      dueDateTo: dueDateTo || undefined,
    }),
    [type, page, search, partyId, status, overduePeriod, debtDateFrom, debtDateTo, dueDateFrom, dueDateTo],
  );

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getDebts(filters);
      setDebts(data.debts);
      setTotal(data.total);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const resetToFirstPage = (setter: () => void) => {
    setter();
    setPage(1);
  };

  const columns = [
    { header: "Debt #", value: (row: Debt) => row.debtNumber },
    { header: partyLabel, value: (row: Debt) => (type === "CUSTOMER" ? row.customer?.name : row.supplier?.name) ?? "—" },
    { header: "Original", value: (row: Debt) => row.originalAmount },
    { header: "Paid", value: (row: Debt) => row.totalPaid },
    { header: "Balance", value: (row: Debt) => row.outstandingBalance },
    { header: "Due date", value: (row: Debt) => row.dueDate ?? "" },
    { header: "Status", value: (row: Debt) => DEBT_STATUS_LABELS[row.status] },
  ];
  const pdf = () => debts.length && exportTablePdf({ title: `${partyLabel} Debts`, fileName: `${type.toLowerCase()}-debts.pdf`, columns, rows: debts });
  const excel = () => debts.length ? exportTableExcel({ sheetName: `${type} Debts`, fileName: `${type.toLowerCase()}-debts.xlsx`, columns, rows: debts }) : undefined;
  const csv = () => debts.length && exportTableCsv({ fileName: `${type.toLowerCase()}-debts.csv`, columns, rows: debts });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">{partyLabel} Debts</h1>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-0.5 text-xs font-bold text-ink/60">{total}</span>
        </div>
        <div className="flex gap-2">
          <button disabled={!debts.length} onClick={pdf} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><FileDown size={14} /> PDF</button>
          <button disabled={!debts.length} onClick={() => csv()} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><FileDown size={14} /> CSV</button>
          <button disabled={!debts.length} onClick={() => void excel()} className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"><Sheet size={14} /> Excel</button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
          Search
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
            <input value={search} onChange={(e) => resetToFirstPage(() => setSearch(e.target.value))} placeholder="Debt # or name" className="w-48 rounded-xl border border-ink/15 py-2 pl-8 pr-3 text-sm" />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
          {partyLabel}
          <select value={partyId} onChange={(e) => resetToFirstPage(() => setPartyId(e.target.value))} className="w-44 rounded-xl border border-ink/15 px-3 py-2 text-sm">
            <option value="">All</option>
            {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
          Status
          <select value={status} onChange={(e) => resetToFirstPage(() => setStatus(e.target.value as DebtStatus | ""))} className="w-40 rounded-xl border border-ink/15 px-3 py-2 text-sm">
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{DEBT_STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
          Overdue period
          <select value={overduePeriod} onChange={(e) => resetToFirstPage(() => setOverduePeriod(e.target.value as OverduePeriod | ""))} className="w-44 rounded-xl border border-ink/15 px-3 py-2 text-sm">
            <option value="">Any</option>
            {OVERDUE_PERIODS.map((p) => <option key={p} value={p}>{OVERDUE_PERIOD_LABELS[p]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">Debt date from<input type="date" value={debtDateFrom} onChange={(e) => resetToFirstPage(() => setDebtDateFrom(e.target.value))} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">to<input type="date" value={debtDateTo} onChange={(e) => resetToFirstPage(() => setDebtDateTo(e.target.value))} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">Due date from<input type="date" value={dueDateFrom} onChange={(e) => resetToFirstPage(() => setDueDateFrom(e.target.value))} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label>
        <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">to<input type="date" value={dueDateTo} onChange={(e) => resetToFirstPage(() => setDueDateTo(e.target.value))} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-8 text-center text-sm font-semibold text-ink/45">Loading debts…</div>
      ) : debts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-10 text-center text-sm font-semibold text-ink/45">No {partyLabel.toLowerCase()} debts match these filters.</div>
      ) : (
        <div className="portal-table-card mt-4">
          <div className="overflow-x-auto">
            <table className="portal-data-table w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#f7faf9] text-xs uppercase text-ink/45">
                <tr>
                  <th className="px-4 py-3">Debt #</th>
                  <th className="px-4 py-3">{partyLabel}</th>
                  <th className="px-4 py-3 text-right">Original</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {debts.map((debt) => (
                  <tr key={debt.id} className="transition-colors hover:bg-[#f7faf9]">
                    <td className="px-4 py-3 font-bold">{debt.debtNumber}</td>
                    <td className="px-4 py-3">{(type === "CUSTOMER" ? debt.customer?.name : debt.supplier?.name) ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(debt.originalAmount, currency)}</td>
                    <td className="px-4 py-3 text-right text-leaf">{formatCurrency(debt.totalPaid, currency)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(debt.outstandingBalance, currency)}</td>
                    <td className="px-4 py-3">{debt.dueDate ?? "—"}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={debt.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/debts/${debt.id}`} className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-[#eef8f4]">View</Link>
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
