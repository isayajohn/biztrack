import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Search, X } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import { getStockMovements } from "../services/inventoryApi";
import type { StockMovement } from "../services/inventoryApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BadgeConfig = { label: string; className: string };
const MOVEMENT_BADGE: Record<string, BadgeConfig> = {
  STOCK_IN: { label: "Stock In", className: "bg-mint text-leaf" },
  STOCK_OUT: { label: "Stock Out", className: "bg-red-50 text-red-600" },
  SALE: { label: "Sale", className: "bg-blue-50 text-blue-700" },
  PURCHASE: { label: "Purchase", className: "bg-teal-50 text-teal-700" },
  DAMAGED: { label: "Damaged", className: "bg-orange-50 text-orange-700" },
  ADJUSTMENT: { label: "Adjustment", className: "bg-purple-50 text-purple-700" },
  RETURN: { label: "Return", className: "bg-cyan-50 text-cyan-700" },
};

function MovementBadge({ type }: { type: string }) {
  const cfg = MOVEMENT_BADGE[type] ?? { label: type, className: "bg-[#f4f0e8] text-ink/60" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const MOVEMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "STOCK_IN", label: "Stock In" },
  { value: "STOCK_OUT", label: "Stock Out" },
  { value: "SALE", label: "Sale" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "RETURN", label: "Return" },
];

const IS_INBOUND: Record<string, boolean> = {
  STOCK_IN: true,
  PURCHASE: true,
  RETURN: true,
  ADJUSTMENT: false,
  STOCK_OUT: false,
  SALE: false,
  DAMAGED: false,
};

const PAGE_SIZE = 25;

// ─── StockMovementsPage ───────────────────────────────────────────────────────

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("");
  const [page, setPage] = useState(1);

  const load = async (p = page, type = movementType) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getStockMovements({
        movementType: type || undefined,
        page: p,
      });
      setMovements(result.movements);
      setTotal(result.total);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load(1, movementType);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementType]);

  useEffect(() => {
    void load(page, movementType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return movements;
    const q = search.toLowerCase();
    return movements.filter((m) => m.productName.toLowerCase().includes(q));
  }, [movements, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Stock Movements</h1>
          <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {total}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
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
              className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
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
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          >
            {MOVEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading movements…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f4f0e8] text-ink/30">
            <ArrowLeftRight size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">No stock movements found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/8 bg-[#fbfaf6]">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink/45">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink/45">
                    Before → After
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isIn = IS_INBOUND[m.movementType] ?? true;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-ink/5 last:border-b-0 transition-colors hover:bg-[#fbfaf6]"
                    >
                      <td className="px-4 py-3 text-xs text-ink/60">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{m.productName}</td>
                      <td className="px-4 py-3">
                        <MovementBadge type={m.movementType} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold ${isIn ? "text-leaf" : "text-clay"}`}
                        >
                          {isIn ? "+" : "-"}{m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-ink/60">
                        {m.stockBefore} → {m.stockAfter}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink/60">
                        {m.reason ?? <span className="text-ink/25">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 lg:hidden">
            {filtered.map((m) => {
              const isIn = IS_INBOUND[m.movementType] ?? true;
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-ink">{m.productName}</p>
                    <MovementBadge type={m.movementType} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/60">
                    <span>
                      Qty:{" "}
                      <span className={`font-bold ${isIn ? "text-leaf" : "text-clay"}`}>
                        {isIn ? "+" : "-"}{m.quantity}
                      </span>
                    </span>
                    <span>
                      {m.stockBefore} → {m.stockAfter}
                    </span>
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  {m.reason && (
                    <p className="mt-1 text-xs text-ink/50">{m.reason}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-ink/15 px-4 py-2 font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-ink/50">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-ink/15 px-4 py-2 font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
