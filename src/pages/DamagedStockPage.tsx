import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Plus, XCircle } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  approveDamagedStock,
  getDamagedStock,
  rejectDamagedStock,
  reportDamagedStock,
} from "../services/inventoryApi";
import type { DamagedStock } from "../services/inventoryApi";
import { getProducts } from "../services/productService";
import type { Product } from "../types/product";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-red-100 text-red-700",
    REJECTED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

type ReportModalProps = {
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
};

function ReportModal({ products, onClose, onSaved }: ReportModalProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { setError("Select a product."); return; }
    if (!reason.trim()) { setError("Reason is required."); return; }
    setSaving(true);
    try {
      await reportDamagedStock({ productId, quantity, reason, comment: comment || undefined });
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Report Damaged Stock</h2>
        {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none">
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Quantity Damaged</label>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Broken during transport"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Comment (optional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {saving ? "Reporting…" : "Report Damage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DamagedStockPage() {
  const [records, setRecords] = useState<DamagedStock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dmg, prods] = await Promise.all([getDamagedStock(), getProducts()]);
      setRecords(dmg);
      setProducts(prods);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await approveDamagedStock(id);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try {
      await rejectDamagedStock(id);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Damaged Stock</h1>
          <p className="text-sm text-gray-500">Track and approve damaged or lost inventory</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <Plus size={16} /> Report Damage
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" /></div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
          <AlertTriangle size={48} className="mb-4 text-gray-300" />
          <p className="font-semibold text-gray-500">No damaged stock reports</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{r.product?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 font-bold text-red-600">{r.quantity}</td>
                  <td className="px-5 py-3.5 text-gray-600">{r.reason}</td>
                  <td className="px-5 py-3.5">{statusBadge(r.status)}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(r.id)} disabled={acting === r.id}
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50">
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => handleReject(r.id)} disabled={acting === r.id}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ReportModal
          products={products}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
