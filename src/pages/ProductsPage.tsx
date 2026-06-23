import { useEffect, useMemo, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import {
  Boxes,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import QuickAddDialog from "../components/app/QuickAddDialog";
import {
  deleteProduct,
  getProducts,
} from "../services/productService";
import { getApiErrorMessage } from "../services/apiClient";
import type { FilterKey, Product } from "../types/product";
import { formatCurrency } from "../utils/format";

// ─── Filter definitions ───────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "low-stock", label: "Low Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profitMargin(p: Product) {
  const margin = p.sellingPrice - p.buyingPrice;
  const pct =
    p.buyingPrice > 0
      ? Math.round((margin / p.buyingPrice) * 100)
      : 0;
  return { margin, pct };
}

function applyFilter(products: Product[], filter: FilterKey): Product[] {
  switch (filter) {
    case "low-stock":
      return products.filter((p) => p.stock > 0 && p.stock <= p.lowStockLevel);
    case "out-of-stock":
      return products.filter((p) => p.stock === 0);
    case "active":
      return products.filter((p) => p.isActive);
    case "inactive":
      return products.filter((p) => !p.isActive);
    default:
      return products;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockBadge({ product }: { product: Product }) {
  if (product.stock === 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
        Out of stock
      </span>
    );
  }
  if (product.stock <= product.lowStockLevel) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        Low stock
      </span>
    );
  }
  return null;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isActive ? "bg-mint text-leaf" : "bg-[#f4f0e8] text-ink/50"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function MarginDisplay({ product }: { product: Product }) {
  const { margin, pct } = profitMargin(product);
  const positive = margin >= 0;
  return (
    <span
      className={`whitespace-nowrap text-sm font-bold ${positive ? "text-leaf" : "text-clay"}`}
    >
      {positive ? "+" : ""}
      {formatCurrency(margin)} ({pct}%)
    </span>
  );
}

// ─── ProductCard (mobile) ─────────────────────────────────────────────────────

type CardProps = {
  product: Product;
  isConfirmingDelete: boolean;
  onEditDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

function ProductCard({
  product: p,
  isConfirmingDelete,
  onEditDelete,
  onConfirmDelete,
  onCancelDelete,
}: CardProps) {
  const fmt = (n: number) => formatCurrency(n);

  return (
    <article className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-ink">
            {p.name}
          </p>
          {p.sku && (
            <p className="text-xs font-semibold text-ink/40">SKU: {p.sku}</p>
          )}
        </div>
        <StatusBadge isActive={p.isActive} />
      </div>

      {/* Pricing */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-ink/8 rounded-lg border border-ink/8 bg-[#fbfaf6]">
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold text-ink/45">Buy</p>
          <p className="text-sm font-bold text-ink">{fmt(p.buyingPrice)}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold text-ink/45">Sell</p>
          <p className="text-sm font-bold text-ink">{fmt(p.sellingPrice)}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold text-ink/45">Margin</p>
          <MarginDisplay product={p} />
        </div>
      </div>

      {/* Category + Stock */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {p.category && (
          <span className="rounded-full bg-[#f4f0e8] px-2 py-0.5 text-[10px] font-bold text-ink/60">
            {p.category.name}
          </span>
        )}
        <span className="text-sm font-semibold text-ink/70">
          Stock: <span className="font-bold text-ink">{p.stock}</span>
        </span>
        <StockBadge product={p} />
      </div>

      {/* Actions */}
      <div className="mt-3 border-t border-ink/8 pt-3">
        {isConfirmingDelete ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-clay">
              Delete this product?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirmDelete(p.id)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
              >
                Yes, delete
              </button>
              <button
                onClick={onCancelDelete}
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink/60 hover:bg-[#f4f0e8] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to={`/products/${p.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/15 py-2 text-xs font-bold text-ink hover:bg-[#f4f0e8] transition-colors"
            >
              <Pencil size={13} aria-hidden="true" />
              Edit
            </Link>
            <button
              onClick={() => onEditDelete(p.id)}
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

// ─── ProductRow (desktop table) ───────────────────────────────────────────────

type RowProps = {
  product: Product;
  isConfirmingDelete: boolean;
  onEditDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

function ProductRow({
  product: p,
  isConfirmingDelete,
  onEditDelete,
  onConfirmDelete,
  onCancelDelete,
}: RowProps) {
  const fmt = (n: number) => formatCurrency(n);

  return (
    <TableRow hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
      <TableCell sx={{ py: 1.5, pl: 2, width: "22%" }}>
        <p className="truncate font-bold text-ink">{p.name}</p>
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "10%" }} className="truncate text-sm text-ink/70">
        {p.sku ?? <span className="text-ink/30">—</span>}
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "12%" }}>
        {p.category ? (
          <span className="rounded-full bg-[#f4f0e8] px-2 py-0.5 text-[10px] font-bold text-ink/60">
            {p.category.name}
          </span>
        ) : (
          <span className="text-ink/30">—</span>
        )}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "13%" }} className="whitespace-nowrap text-sm font-semibold text-ink">
        {fmt(p.buyingPrice)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "13%" }} className="whitespace-nowrap text-sm font-semibold text-ink">
        {fmt(p.sellingPrice)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, width: "15%" }}>
        <MarginDisplay product={p} />
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "12%" }}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold text-ink">{p.stock}</span>
          <StockBadge product={p} />
        </div>
      </TableCell>
      <TableCell sx={{ py: 1.5, width: "11%" }}>
        <StatusBadge isActive={p.isActive} />
      </TableCell>
      <TableCell align="right" sx={{ py: 1.5, pr: 2, width: "10%" }}>
        {isConfirmingDelete ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => onConfirmDelete(p.id)}
              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={onCancelDelete}
              className="rounded-lg border border-ink/15 px-2 py-1 text-xs font-bold text-ink/50 hover:bg-[#f4f0e8] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              to={`/products/${p.id}/edit`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/50 hover:bg-[#f4f0e8] hover:text-ink transition-colors"
              aria-label={`Edit ${p.name}`}
            >
              <Pencil size={14} aria-hidden="true" />
            </Link>
            <button
              onClick={() => onEditDelete(p.id)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label={`Delete ${p.name}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── ProductsPage ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  // Filter counts
  const counts = useMemo(
    () => ({
      all: products.length,
      "low-stock": products.filter(
        (p) => p.stock > 0 && p.stock <= p.lowStockLevel,
      ).length,
      "out-of-stock": products.filter((p) => p.stock === 0).length,
      active: products.filter((p) => p.isActive).length,
      inactive: products.filter((p) => !p.isActive).length,
    }),
    [products],
  );

  // Filtered list
  const filtered = useMemo(() => {
    let result = applyFilter(products, filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [products, filter, search]);
  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  useEffect(() => {
    setPage(0);
  }, [search, filter, rowsPerPage, filtered.length]);

  // Handlers
  const handleDeleteClick = (id: string) => setDeletingId(id);
  const handleCancelDelete = () => setDeletingId(null);
  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
    setDeletingId(null);
  };

  const emptyMessage =
    search || filter !== "all"
      ? "No products match your search or filter."
      : "No products yet. Add your first product.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Products</h1>
          <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {products.length}
          </span>
        </div>
        <QuickAddDialog
          formType="product"
          triggerLabel="Add Product"
          triggerClassName="flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-leaf/90 transition-colors"
          onSaved={loadProducts}
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
            placeholder="Search by product name or SKU…"
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

        {/* Filter tabs */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors",
                filter === key
                  ? "bg-ink text-white"
                  : "border border-ink/10 bg-white text-ink/60 hover:bg-[#f4f0e8]",
              ].join(" ")}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === key
                    ? "bg-white/20 text-white"
                    : "bg-ink/8 text-ink/50"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/8 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-ink/35">Visible products</p>
            <p className="mt-1 text-lg font-black text-ink">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-ink/8 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-ink/35">Low stock</p>
            <p className="mt-1 text-lg font-black text-amber-700">{counts["low-stock"]}</p>
          </div>
          <div className="rounded-xl border border-ink/8 bg-white px-4 py-3">
            <p className="text-xs font-bold uppercase text-ink/35">Out of stock</p>
            <p className="mt-1 text-lg font-black text-red-600">{counts["out-of-stock"]}</p>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading products...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f4f0e8] text-ink/30">
            <Boxes size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">{emptyMessage}</p>
          {!search && filter === "all" && (
            <Link
              to="/products/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white hover:bg-leaf/90 transition-colors"
            >
              <Plus size={14} aria-hidden="true" />
              Add first product
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 lg:hidden">
            {paginated.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isConfirmingDelete={deletingId === p.id}
                onEditDelete={handleDeleteClick}
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
              <Table aria-label="Products table" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow className="bg-[#fbfaf6]">
                    <TableCell sx={{ py: 1.25, pl: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Product
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    SKU
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Category
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Buy Price
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Sell Price
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Margin
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Stock
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Status
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, pr: 2 }} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {paginated.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    isConfirmingDelete={deletingId === p.id}
                    onEditDelete={handleDeleteClick}
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
