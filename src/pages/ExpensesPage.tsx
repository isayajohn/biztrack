import { useEffect, useMemo, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuickAddDialog from "../components/app/QuickAddDialog";
import { deleteExpense, getExpenses } from "../services/expenseService";
import { getApiErrorMessage } from "../services/apiClient";
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryFilter,
  ExpenseDateFilter,
  ExpensePaymentFilter,
  ExpensePaymentMethod,
} from "../types/expense";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "../types/expense";
import { formatCurrency } from "../utils/format";

// ─── Date filter helpers ──────────────────────────────────────────────────────

const DATE_FILTERS: { key: ExpenseDateFilter; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function applyDateFilter(expenses: Expense[], filter: ExpenseDateFilter): Expense[] {
  const today = todayStr();
  if (filter === "today") return expenses.filter((e) => e.expenseDate === today);
  if (filter === "week") {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const start = d.toISOString().split("T")[0];
    return expenses.filter((e) => e.expenseDate >= start && e.expenseDate <= today);
  }
  if (filter === "month") {
    const start = today.slice(0, 7) + "-01";
    return expenses.filter((e) => e.expenseDate >= start && e.expenseDate <= today);
  }
  return expenses;
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

const CATEGORY_BADGE_CLS: Record<ExpenseCategory, string> = {
  "Stock Purchase": "bg-mint text-leaf",
  Rent: "bg-purple-50 text-purple-700",
  Transport: "bg-amber-50 text-amber-700",
  Salary: "bg-sky-50 text-sky-700",
  Electricity: "bg-yellow-50 text-yellow-700",
  Internet: "bg-blue-50 text-blue-700",
  Food: "bg-orange-50 text-clay",
  Marketing: "bg-rose-50 text-rose-700",
  Other: "bg-[#eef8f4] text-ink/60",
};

const PAYMENT_BADGE_CLS: Record<ExpensePaymentMethod, string> = {
  Cash: "bg-mint text-leaf",
  "Mobile Money": "bg-sky-50 text-sky-700",
  Bank: "bg-purple-50 text-purple-700",
  Credit: "bg-amber-50 text-amber-700",
};

function CategoryBadge({ category }: { category: ExpenseCategory }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_BADGE_CLS[category]}`}
    >
      {category}
    </span>
  );
}

function PaymentBadge({ method }: { method: ExpensePaymentMethod }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PAYMENT_BADGE_CLS[method]}`}
    >
      {method}
    </span>
  );
}

// ─── ExpenseCard (mobile) ─────────────────────────────────────────────────────

type CardProps = {
  expense: Expense;
  isConfirmingDelete: boolean;
  onDeleteClick: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

function ExpenseCard({
  expense: e,
  isConfirmingDelete,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: CardProps) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink">
            {e.description}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink/40">
            {formatDate(e.expenseDate)}
          </p>
        </div>
        {/* Amount — large and visible */}
        <p className="shrink-0 text-lg font-black text-clay">
          {formatCurrency(e.amount)}
        </p>
      </div>

      {/* Badges */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={e.category} />
        <PaymentBadge method={e.paymentMethod} />
      </div>

      {/* Notes */}
      {e.notes && (
        <p className="mt-2 text-xs text-ink/50 italic">{e.notes}</p>
      )}

      {/* Actions */}
      <div className="mt-3 border-t border-ink/8 pt-3">
        {isConfirmingDelete ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-clay">
              Delete this expense?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirmDelete(e.id)}
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
            <Link
              to={`/expenses/${e.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/15 py-2 text-xs font-bold text-ink hover:bg-[#eef8f4] transition-colors"
            >
              <Pencil size={13} aria-hidden="true" />
              Edit
            </Link>
            <button
              onClick={() => onDeleteClick(e.id)}
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

// ─── ExpenseRow (desktop table) ───────────────────────────────────────────────

type RowProps = {
  expense: Expense;
  isConfirmingDelete: boolean;
  onDeleteClick: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

function ExpenseRow({
  expense: e,
  isConfirmingDelete,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: RowProps) {
  return (
    <TableRow hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
      <TableCell sx={{ py: 1.5, pl: 2, width: "32%" }}>
        <p className="truncate font-bold text-ink">{e.description}</p>
        {e.notes && (
          <p className="max-w-[280px] truncate text-xs italic text-ink/40">
            {e.notes}
          </p>
        )}
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "16%" }}>
        <CategoryBadge category={e.category} />
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "14%" }} className="whitespace-nowrap text-sm text-ink/60">{formatDate(e.expenseDate)}</TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "15%" }}>
        <span className="text-base font-black text-clay">
          {formatCurrency(e.amount)}
        </span>
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "13%" }}>
        <PaymentBadge method={e.paymentMethod} />
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, pr: 2, width: "10%" }}>
        {isConfirmingDelete ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => onConfirmDelete(e.id)}
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
            <Link
              to={`/expenses/${e.id}/edit`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/50 hover:bg-[#eef8f4] hover:text-ink transition-colors"
              aria-label={`Edit ${e.description}`}
            >
              <Pencil size={14} aria-hidden="true" />
            </Link>
            <button
              onClick={() => onDeleteClick(e.id)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label={`Delete ${e.description}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── ExpensesPage ─────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<ExpenseDateFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategoryFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<ExpensePaymentFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadExpenses = async () => {
    setIsLoading(true);
    setError("");
    try {
      setExpenses(await getExpenses());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, []);

  // Category counts (after date filter, before category/payment/search)
  const categoryCounts = useMemo(() => {
    const base = applyDateFilter(expenses, dateFilter);
    const counts: Record<string, number> = { all: base.length };
    for (const c of EXPENSE_CATEGORIES) {
      counts[c] = base.filter((e) => e.category === c).length;
    }
    return counts;
  }, [expenses, dateFilter]);

  // Payment counts (after date + category filter, before payment/search)
  const paymentCounts = useMemo(() => {
    let base = applyDateFilter(expenses, dateFilter);
    if (categoryFilter !== "all") {
      base = base.filter((e) => e.category === categoryFilter);
    }
    const counts: Record<string, number> = { all: base.length };
    for (const m of EXPENSE_PAYMENT_METHODS) {
      counts[m] = base.filter((e) => e.paymentMethod === m).length;
    }
    return counts;
  }, [expenses, dateFilter, categoryFilter]);

  // Fully filtered + sorted list
  const filtered = useMemo(() => {
    let result = applyDateFilter(expenses, dateFilter);
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter);
    }
    if (paymentFilter !== "all") {
      result = result.filter((e) => e.paymentMethod === paymentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.description.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) =>
      a.expenseDate !== b.expenseDate
        ? b.expenseDate.localeCompare(a.expenseDate)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [expenses, dateFilter, categoryFilter, paymentFilter, search]);

  // Total for visible rows
  const totalAmount = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );
  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  useEffect(() => {
    setPage(0);
  }, [search, dateFilter, categoryFilter, paymentFilter, rowsPerPage, filtered.length]);

  // Handlers
  const handleDeleteClick = (id: string) => setDeletingId(id);
  const handleCancelDelete = () => setDeletingId(null);
  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      await loadExpenses();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
    setDeletingId(null);
  };

  const hasActiveFilter =
    search || dateFilter !== "all" || categoryFilter !== "all" || paymentFilter !== "all";

  const emptyMessage = hasActiveFilter
    ? "No expenses match your search or filters."
    : "No expenses yet. Add your first expense.";

  const PAYMENT_FILTER_OPTIONS: { key: ExpensePaymentFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...EXPENSE_PAYMENT_METHODS.map((m) => ({ key: m as ExpensePaymentFilter, label: m })),
  ];

  const CATEGORY_FILTER_OPTIONS: { key: ExpenseCategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...EXPENSE_CATEGORIES.map((c) => ({ key: c as ExpenseCategoryFilter, label: c })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Expenses</h1>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {expenses.length}
          </span>
        </div>
        <QuickAddDialog
          formType="expense"
          triggerLabel="Add Expense"
          triggerClassName="flex items-center gap-1.5 rounded-xl bg-clay px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-clay/90 transition-colors"
          onSaved={loadExpenses}
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
            placeholder="Search by description…"
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

        {/* Category filter */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                categoryFilter === key
                  ? "bg-ink text-white"
                  : "border border-ink/10 bg-white text-ink/60 hover:bg-[#eef8f4]",
              ].join(" ")}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  categoryFilter === key
                    ? "bg-white/20 text-white"
                    : "bg-ink/8 text-ink/50"
                }`}
              >
                {categoryCounts[key] ?? 0}
              </span>
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
            <p className="text-xs font-bold uppercase text-ink/35">Visible expenses</p>
            <p className="mt-1 text-lg font-black text-ink">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-ink/8 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-ink/35">Total spent</p>
            <p className="mt-1 text-lg font-black text-clay">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white px-4 py-3">
            <WalletCards size={18} className="shrink-0 text-clay" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink/55">Sorted by newest expense first.</p>
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
          Loading expenses...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef8f4] text-ink/30">
            <WalletCards size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">{emptyMessage}</p>
          {!hasActiveFilter && (
            <Link
              to="/expenses/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-clay px-4 py-2.5 text-sm font-bold text-white hover:bg-clay/90 transition-colors"
            >
              <Plus size={14} aria-hidden="true" />
              Add first expense
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 lg:hidden">
            {paginated.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                isConfirmingDelete={deletingId === e.id}
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
              <Table aria-label="Expenses table" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow className="bg-[#f7faf9]">
                    <TableCell sx={{ py: 1.25, pl: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Description
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Category
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Date
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Amount
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
                {paginated.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    isConfirmingDelete={deletingId === e.id}
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
