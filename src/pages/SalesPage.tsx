import { useEffect, useMemo, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import {
  CircleDollarSign,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuickAddDialog from "../components/app/QuickAddDialog";
import { deleteSale, getSales } from "../services/saleService";
import { getApiErrorMessage } from "../services/apiClient";
import type {
  Sale,
  SaleDateFilter,
  SalePaymentFilter,
  PaymentMethod,
} from "../types/sale";
import { PAYMENT_METHODS } from "../types/sale";
import { formatCurrency } from "../utils/format";

// ─── Date filter helpers ──────────────────────────────────────────────────────

const DATE_FILTERS: { key: SaleDateFilter; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function weekStartStr(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  return d.toISOString().split("T")[0];
}

function monthStartStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function applyDateFilter(sales: Sale[], filter: SaleDateFilter): Sale[] {
  const today = todayStr();
  if (filter === "today") return sales.filter((s) => s.saleDate === today);
  if (filter === "week") {
    const start = weekStartStr();
    return sales.filter((s) => s.saleDate >= start && s.saleDate <= today);
  }
  if (filter === "month") {
    const start = monthStartStr();
    return sales.filter((s) => s.saleDate >= start && s.saleDate <= today);
  }
  return sales;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Badge components ─────────────────────────────────────────────────────────

const PAYMENT_BADGE_CLS: Record<PaymentMethod, string> = {
  Cash: "bg-mint text-leaf",
  "Mobile Money": "bg-sky-50 text-sky-700",
  Bank: "bg-purple-50 text-purple-700",
  Credit: "bg-amber-50 text-amber-700",
};

function PaymentBadge({ method }: { method: PaymentMethod }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PAYMENT_BADGE_CLS[method]}`}
    >
      {method}
    </span>
  );
}

// ─── SaleCard (mobile) ────────────────────────────────────────────────────────

type CardProps = {
  sale: Sale;
  isConfirmingDelete: boolean;
  onDeleteClick: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

function SaleCard({
  sale: s,
  isConfirmingDelete,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: CardProps) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-ink">
            {s.productName}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink/40">
            {formatDate(s.saleDate)}
          </p>
        </div>
        <PaymentBadge method={s.paymentMethod} />
      </div>

      {/* Amounts */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-ink/8 rounded-lg border border-ink/8 bg-[#f7faf9]">
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold text-ink/45">Qty</p>
          <p className="text-sm font-bold text-ink">{s.quantity}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold text-ink/45">Unit price</p>
          <p className="text-sm font-bold text-ink">
            {formatCurrency(s.unitPrice)}
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold text-ink/45">Total</p>
          <p className="text-sm font-bold text-leaf">
            {formatCurrency(s.totalAmount)}
          </p>
        </div>
      </div>

      {/* Notes */}
      {s.notes && (
        <p className="mt-2.5 text-xs text-ink/50 italic">{s.notes}</p>
      )}

      {/* Actions */}
      <div className="mt-3 border-t border-ink/8 pt-3">
        {isConfirmingDelete ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-clay">Delete this sale?</p>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirmDelete(s.id)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
              >
                Yes, delete
              </button>
              <button
                onClick={onCancelDelete}
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink/60 hover:bg-[#eef8f4] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to={`/sales/${s.id}/receipt`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-leaf/20 py-2 text-xs font-bold text-leaf hover:bg-mint transition-colors"><Printer size={13} /> Receipt</Link>
            <Link
              to={`/sales/${s.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/15 py-2 text-xs font-bold text-ink hover:bg-[#eef8f4] transition-colors"
            >
              <Pencil size={13} aria-hidden="true" />
              Edit
            </Link>
            <button
              onClick={() => onDeleteClick(s.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── SaleRow (desktop table) ──────────────────────────────────────────────────

type RowProps = {
  sale: Sale;
  isConfirmingDelete: boolean;
  onDeleteClick: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

function SaleRow({
  sale: s,
  isConfirmingDelete,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: RowProps) {
  return (
    <TableRow hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
      <TableCell sx={{ py: 1.5, pl: 2, width: "28%" }}>
        <p className="truncate font-bold text-ink">{s.productName}</p>
        {s.notes && (
          <p className="max-w-[260px] truncate text-xs italic text-ink/40">
            {s.notes}
          </p>
        )}
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "13%" }} className="whitespace-nowrap text-sm text-ink/60">{formatDate(s.saleDate)}</TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "8%" }} className="text-sm font-semibold text-ink">
        {s.quantity}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "14%" }} className="whitespace-nowrap text-sm font-semibold text-ink">
        {formatCurrency(s.unitPrice)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "15%" }} className="whitespace-nowrap text-sm font-bold text-leaf">
        {formatCurrency(s.totalAmount)}
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "12%" }}>
        <PaymentBadge method={s.paymentMethod} />
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, pr: 2, width: "10%" }}>
        {isConfirmingDelete ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => onConfirmDelete(s.id)}
              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={onCancelDelete}
              className="rounded-lg border border-ink/15 px-2 py-1 text-xs font-bold text-ink/50 hover:bg-[#eef8f4] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <Link to={`/sales/${s.id}/receipt`} className="grid h-8 w-8 place-items-center rounded-lg border border-leaf/20 text-leaf hover:bg-mint transition-colors" aria-label={`Print ${s.productName} receipt`}><Printer size={14} /></Link>
            <Link
              to={`/sales/${s.id}/edit`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/50 hover:bg-[#eef8f4] hover:text-ink transition-colors"
              aria-label={`Edit ${s.productName} sale`}
            >
              <Pencil size={14} aria-hidden="true" />
            </Link>
            <button
              onClick={() => onDeleteClick(s.id)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label={`Delete ${s.productName} sale`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── SalesPage ────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<SaleDateFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<SalePaymentFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadSales = async () => {
    setIsLoading(true);
    setError("");
    try {
      setSales(await getSales());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSales();
  }, []);

  // Payment filter counts (per date filter, before payment/search filter)
  const paymentCounts = useMemo(() => {
    const dateFiltered = applyDateFilter(sales, dateFilter);
    const counts: Record<string, number> = { all: dateFiltered.length };
    for (const m of PAYMENT_METHODS) {
      counts[m] = dateFiltered.filter((s) => s.paymentMethod === m).length;
    }
    return counts;
  }, [sales, dateFilter]);

  // Fully filtered + sorted list
  const filtered = useMemo(() => {
    let result = applyDateFilter(sales, dateFilter);
    if (paymentFilter !== "all") {
      result = result.filter((s) => s.paymentMethod === paymentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.productName.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) =>
      a.saleDate !== b.saleDate
        ? b.saleDate.localeCompare(a.saleDate)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [sales, dateFilter, paymentFilter, search]);

  // Total for currently visible rows
  const totalAmount = useMemo(
    () => filtered.reduce((sum, s) => sum + s.totalAmount, 0),
    [filtered],
  );
  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  useEffect(() => {
    setPage(0);
  }, [search, dateFilter, paymentFilter, rowsPerPage, filtered.length]);

  // Handlers
  const handleDeleteClick = (id: string) => setDeletingId(id);
  const handleCancelDelete = () => setDeletingId(null);
  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteSale(id);
      await loadSales();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
    setDeletingId(null);
  };

  const emptyMessage =
    search || dateFilter !== "all" || paymentFilter !== "all"
      ? "No sales match your search or filters."
      : "No sales yet. Record your first sale.";

  const PAYMENT_FILTER_OPTIONS: { key: SalePaymentFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...PAYMENT_METHODS.map((m) => ({ key: m as SalePaymentFilter, label: m })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Sales</h1>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {sales.length}
          </span>
        </div>
        <QuickAddDialog
          formType="sale"
          triggerLabel="Record Sale"
          triggerClassName="flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-leaf/90 transition-colors"
          onSaved={loadSales}
        />
      </div>

      {/* ── Search + Filters ── */}
      <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3 shadow-sm">
        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name…"
            className="w-full rounded-xl border border-ink/15 bg-[#f7faf9] py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Date filter */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {DATE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                dateFilter === key
                  ? "bg-ink text-white"
                  : "border border-ink/10 bg-white text-ink/60 hover:bg-[#eef8f4]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Payment method filter */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {PAYMENT_FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPaymentFilter(key)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                paymentFilter === key
                  ? "bg-ink text-white"
                  : "border border-ink/10 bg-white text-ink/60 hover:bg-[#eef8f4]",
              ].join(" ")}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  paymentFilter === key
                    ? "bg-white/20 text-white"
                    : "bg-ink/8 text-ink/50"
                }`}
              >
                {paymentCounts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary strip ── */}
      {filtered.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/8 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-ink/35">Visible sales</p>
            <p className="mt-1 text-lg font-black text-ink">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-ink/8 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-ink/35">Total amount</p>
            <p className="mt-1 text-lg font-black text-leaf">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white px-4 py-3">
            <CircleDollarSign size={18} className="shrink-0 text-leaf" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink/55">Sorted by newest sale first.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading sales...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef8f4] text-ink/30">
            <CircleDollarSign size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">{emptyMessage}</p>
          {!search && dateFilter === "all" && paymentFilter === "all" && (
            <Link
              to="/sales/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white hover:bg-leaf/90 transition-colors"
            >
              <Plus size={14} aria-hidden="true" />
              Record first sale
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 lg:hidden">
            {paginated.map((s) => (
              <SaleCard
                key={s.id}
                sale={s}
                isConfirmingDelete={deletingId === s.id}
                onDeleteClick={handleDeleteClick}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={handleCancelDelete}
              />
            ))}
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_event, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </div>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm lg:block">
            <TableContainer>
              <Table aria-label="Sales table" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow className="bg-[#f7faf9]">
                    <TableCell sx={{ py: 1.25, pl: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Product
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Date
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Qty
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Unit Price
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Total
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Payment
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, pr: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {paginated.map((s) => (
                  <SaleRow
                    key={s.id}
                    sale={s}
                    isConfirmingDelete={deletingId === s.id}
                    onDeleteClick={handleDeleteClick}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                  />
                ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_event, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </div>
        </>
      )}
    </div>
  );
}
