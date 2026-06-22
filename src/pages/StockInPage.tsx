import { useEffect, useMemo, useState } from "react";
import { PackagePlus, Search, X } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import { getStockMovements, stockIn } from "../services/inventoryApi";
import type { StockMovement } from "../services/inventoryApi";
import { getProducts } from "../services/productService";
import type { Product } from "../types/product";

// ─── StockInPage ──────────────────────────────────────────────────────────────

export default function StockInPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const loadMovements = async () => {
    setIsLoadingMovements(true);
    try {
      const result = await getStockMovements({ movementType: "STOCK_IN", page: 1 });
      setMovements(result.movements);
    } catch {
      // non-critical
    } finally {
      setIsLoadingMovements(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        setProducts(await getProducts());
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoadingProducts(false);
      }
    };
    void load();
    void loadMovements();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSelectProduct = (p: Product) => {
    setProductId(p.id);
    setProductSearch(p.name);
    setShowDropdown(false);
  };

  const handleClearProduct = () => {
    setProductId("");
    setProductSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError("Please select a product.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      await stockIn({
        productId,
        quantity,
        reason: reason.trim() || undefined,
      });
      // Re-fetch the product to get updated stock
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
      const updated = updatedProducts.find((p) => p.id === productId);
      setSuccessMsg(
        `Added ${quantity} unit(s) to ${selectedProduct?.name ?? "product"}.${
          updated ? ` New stock: ${updated.stock}` : ""
        }`,
      );
      // Reset form
      setProductId("");
      setProductSearch("");
      setQuantity(1);
      setReason("");
      // Reload movements
      void loadMovements();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-xl font-bold text-ink">Stock In</h1>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form card */}
        <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-leaf">
              <PackagePlus size={18} aria-hidden="true" />
            </span>
            <p className="font-bold text-ink">Add Stock</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl border border-leaf/20 bg-mint px-4 py-3 text-sm font-semibold text-leaf">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Product selector */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Product <span className="text-clay">*</span>
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductId("");
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search product…"
                  disabled={isLoadingProducts}
                  className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] py-2.5 pl-10 pr-9 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15 disabled:cursor-wait disabled:opacity-60"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={handleClearProduct}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
                  >
                    <X size={14} />
                  </button>
                )}
                {showDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg">
                    <ul className="max-h-56 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(p)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#fbfaf6]"
                          >
                            <span className="font-semibold text-ink">{p.name}</span>
                            <span className="text-xs text-ink/50">
                              Stock: {p.stock}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {selectedProduct && (
                <p className="mt-1.5 text-xs font-semibold text-ink/50">
                  Current stock:{" "}
                  <span className="font-bold text-ink">{selectedProduct.stock}</span>
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Quantity <span className="text-clay">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                min={1}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Reason (optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Purchase from supplier"
                className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !productId}
              className="rounded-xl bg-leaf py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60"
            >
              {submitting ? "Adding Stock…" : "Add Stock"}
            </button>
          </form>
        </div>

        {/* Recent movements */}
        <div>
          <h2 className="mb-3 font-display text-base font-bold text-ink">
            Recent Stock-In Movements
          </h2>
          {isLoadingMovements ? (
            <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
              Loading…
            </div>
          ) : movements.length === 0 ? (
            <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
              No stock-in movements yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/8 bg-[#fbfaf6]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink/45">
                      Qty Added
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
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-ink/5 last:border-b-0 transition-colors hover:bg-[#fbfaf6]"
                    >
                      <td className="px-4 py-3 text-xs text-ink/60">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{m.productName}</td>
                      <td className="px-4 py-3 text-right font-bold text-leaf">
                        +{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-ink/60">
                        {m.stockBefore} → {m.stockAfter}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink/60">
                        {m.reason ?? <span className="text-ink/25">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
