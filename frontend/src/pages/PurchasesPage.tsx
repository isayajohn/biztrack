import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, ShoppingCart, X } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createPurchase,
  getPurchases,
  getSuppliers,
  receivePurchase,
} from "../services/inventoryApi";
import type { PurchaseOrder, PurchaseOrderItem, Supplier } from "../services/inventoryApi";
import { getProducts } from "../services/productService";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/format";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type StatusConfig = { label: string; className: string };
const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  ORDERED: { label: "Ordered", className: "bg-blue-50 text-blue-700" },
  PARTIAL: { label: "Partial", className: "bg-orange-50 text-orange-700" },
  RECEIVED: { label: "Received", className: "bg-mint text-leaf" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: "bg-[#eef8f4] text-ink/60" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function fmt(n: number) {
  return formatCurrency(n);
}

// ─── New Purchase Modal ───────────────────────────────────────────────────────

type LineItem = { productId: string; quantity: number; unitPrice: number };

type NewPurchaseModalProps = {
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
};

function NewPurchaseModal({ suppliers, products, onClose, onSaved }: NewPurchaseModalProps) {
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addItem = () =>
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitPrice: 0 }]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof LineItem, value: string | number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.productId && i.quantity > 0 && i.unitPrice >= 0);
    if (validItems.length === 0) {
      setError("Add at least one item with a valid product and quantity.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createPurchase({
        supplierId: supplierId || undefined,
        items: validItems,
        notes: notes.trim() || undefined,
        expectedDate: expectedDate || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-ink/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">New Purchase Order</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink/40 transition-colors hover:bg-[#eef8f4] hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Supplier (optional)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              >
                <option value="">— No supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Expected Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Items</p>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-bold text-ink/60 transition-colors hover:bg-[#eef8f4]"
              >
                <Plus size={12} aria-hidden="true" />
                Add Item
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-xl border border-ink/10 bg-[#f7faf9] p-3"
                >
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      placeholder="Qty"
                      className="w-20 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      min={0}
                      step="0.01"
                      onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                      placeholder="Unit price"
                      className="w-28 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-ink/30 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <p className="text-sm font-bold text-ink">
                Total:{" "}
                <span className="text-leaf">{fmt(totalAmount)}</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className="w-full resize-none rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#eef8f4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Receive Modal ────────────────────────────────────────────────────────────

type ReceiveModalProps = {
  order: PurchaseOrder;
  onClose: () => void;
  onSaved: () => void;
};

function ReceiveModal({ order, onClose, onSaved }: ReceiveModalProps) {
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [i.id, i.quantity - i.receivedQuantity])),
  );
  const [paidAmount, setPaidAmount] = useState(order.totalAmount - order.paidAmount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await receivePurchase(order.id, {
        items: order.items.map((i) => ({
          id: i.id,
          receivedQuantity: receivedQtys[i.id] ?? 0,
        })),
        paidAmount: paidAmount,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-ink">
              Receive Order
            </h2>
            <p className="text-xs text-ink/50">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink/40 transition-colors hover:bg-[#eef8f4] hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {order.items.map((item: PurchaseOrderItem) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-[#f7faf9] p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink">{item.productName}</p>
                  <p className="text-xs text-ink/50">
                    Ordered: {item.quantity} · Received: {item.receivedQuantity}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-ink/40">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={receivedQtys[item.id] ?? 0}
                    min={0}
                    max={item.quantity - item.receivedQuantity}
                    onChange={(e) =>
                      setReceivedQtys((prev) => ({
                        ...prev,
                        [item.id]: Number(e.target.value),
                      }))
                    }
                    className="w-20 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
              Amount Paid
            </label>
            <input
              type="number"
              value={paidAmount}
              min={0}
              step="0.01"
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#eef8f4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Mark as Received"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PurchasesPage ────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [ordersData, suppliersData, productsData] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const canReceive = (status: string) =>
    status === "PENDING" || status === "ORDERED" || status === "PARTIAL";

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Purchase Orders</h1>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {orders.length}
          </span>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
        >
          <Plus size={15} aria-hidden="true" />
          New Order
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading purchase orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef8f4] text-ink/30">
            <ShoppingCart size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">
            No purchase orders yet. Create your first order.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-leaf/90"
          >
            <Plus size={14} aria-hidden="true" />
            New Order
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm"
            >
              {/* Order header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-[#eef8f4] hover:text-ink"
                >
                  {expandedId === order.id ? (
                    <ChevronUp size={15} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={15} aria-hidden="true" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-ink">{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-ink/50">
                    {order.supplier?.name ?? "No supplier"} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                    {order.expectedDate &&
                      ` · Expected: ${new Date(order.expectedDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-bold text-ink">{fmt(order.totalAmount)}</p>
                  <p className="text-xs text-ink/50">
                    Paid: {fmt(order.paidAmount)}
                  </p>
                </div>
                {canReceive(order.status) && (
                  <button
                    onClick={() => setReceiving(order)}
                    className="shrink-0 rounded-xl border border-leaf/30 bg-mint px-3 py-1.5 text-xs font-bold text-leaf transition-colors hover:bg-leaf hover:text-white"
                  >
                    Receive
                  </button>
                )}
              </div>

              {/* Expanded items */}
              {expandedId === order.id && (
                <div className="border-t border-ink/8 px-4 pb-3 pt-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="pb-1.5 text-left text-xs font-bold uppercase text-ink/40">
                          Product
                        </th>
                        <th className="pb-1.5 text-right text-xs font-bold uppercase text-ink/40">
                          Qty
                        </th>
                        <th className="pb-1.5 text-right text-xs font-bold uppercase text-ink/40">
                          Received
                        </th>
                        <th className="pb-1.5 text-right text-xs font-bold uppercase text-ink/40">
                          Unit Price
                        </th>
                        <th className="pb-1.5 text-right text-xs font-bold uppercase text-ink/40">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-ink/5">
                          <td className="py-1.5 font-semibold text-ink">
                            {item.productName}
                          </td>
                          <td className="py-1.5 text-right text-ink/70">{item.quantity}</td>
                          <td className="py-1.5 text-right text-ink/70">
                            {item.receivedQuantity}
                          </td>
                          <td className="py-1.5 text-right text-ink/70">
                            {fmt(item.unitPrice)}
                          </td>
                          <td className="py-1.5 text-right font-bold text-ink">
                            {fmt(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {order.notes && (
                    <p className="mt-2 rounded-lg bg-[#f7faf9] px-3 py-2 text-xs text-ink/60">
                      Note: {order.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewPurchaseModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowNew(false)}
          onSaved={load}
        />
      )}

      {receiving && (
        <ReceiveModal
          order={receiving}
          onClose={() => setReceiving(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
