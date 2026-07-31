import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, Plus, X } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  approveAdjustment,
  createAdjustment,
  getAdjustments,
  rejectAdjustment,
} from "../services/inventoryApi";
import type { StockAdjustment } from "../services/inventoryApi";
import { getProducts } from "../services/productService";
import type { Product } from "../types/product";

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [physicalCount, setPhysicalCount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [nextAdjustments, nextProducts] = await Promise.all([getAdjustments(), getProducts()]);
      setAdjustments(nextAdjustments);
      setProducts(nextProducts);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selectedProduct = products.find((product) => product.id === productId);
  const difference = selectedProduct && physicalCount !== "" ? Number(physicalCount) - selectedProduct.stock : null;
  const filtered = useMemo(() => status === "ALL" ? adjustments : adjustments.filter((item) => item.status === status), [adjustments, status]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || physicalCount === "") return;
    setWorkingId("new");
    setError("");
    try {
      await createAdjustment({ productId, physicalCount: Number(physicalCount), reason: reason.trim() || undefined });
      setShowForm(false);
      setProductId("");
      setPhysicalCount("");
      setReason("");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setWorkingId(null);
    }
  };

  const decide = async (id: string, decision: "approve" | "reject") => {
    setWorkingId(id);
    setError("");
    try {
      if (decision === "approve") await approveAdjustment(id);
      else await rejectAdjustment(id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-display text-xl font-bold text-ink">Stock Adjustments</h1><p className="mt-1 text-sm font-semibold text-ink/45">Count physical stock, review differences, and approve corrections.</p></div>
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> New count</button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-xl px-3 py-2 text-xs font-bold ${status === item ? "bg-ink text-white" : "border border-ink/10 bg-white text-ink/55"}`}>{item}</button>)}
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
        {isLoading ? <p className="p-8 text-center text-sm font-semibold text-ink/45">Loading adjustments...</p> : filtered.length === 0 ? <div className="p-10 text-center"><ClipboardCheck className="mx-auto text-ink/20" /><p className="mt-3 text-sm font-semibold text-ink/45">No stock adjustments found.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f7faf9] text-xs uppercase text-ink/45"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">System</th><th className="px-4 py-3 text-right">Physical</th><th className="px-4 py-3 text-right">Difference</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-ink/8">{filtered.map((item) => <tr key={item.id}><td className="px-4 py-3 font-bold">{item.product?.name ?? "Deleted product"}</td><td className="px-4 py-3 text-right">{item.systemStock}</td><td className="px-4 py-3 text-right">{item.physicalCount}</td><td className={`px-4 py-3 text-right font-extrabold ${item.difference < 0 ? "text-red-600" : item.difference > 0 ? "text-leaf" : "text-ink/45"}`}>{item.difference > 0 ? "+" : ""}{item.difference}</td><td className="max-w-[240px] truncate px-4 py-3 text-ink/55">{item.reason || "—"}</td><td className="px-4 py-3"><Status value={item.status} /></td><td className="px-4 py-3"><div className="flex justify-end gap-1.5">{item.status === "PENDING" && <><button disabled={workingId === item.id} onClick={() => void decide(item.id, "approve")} className="rounded-lg border border-leaf/20 bg-mint p-2 text-leaf" title="Approve"><Check size={15} /></button><button disabled={workingId === item.id} onClick={() => void decide(item.id, "reject")} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600" title="Reject"><X size={15} /></button></>}</div></td></tr>)}</tbody></table></div>}
      </section>

      {showForm && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">New physical count</h2><button type="button" onClick={() => setShowForm(false)}><X size={18} /></button></div><div className="mt-4 space-y-4"><label className="block text-xs font-bold text-ink/55">Product<select required value={productId} onChange={(event) => { setProductId(event.target.value); setPhysicalCount(""); }} className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm"><option value="">Select product</option>{products.filter((product) => product.isActive).map((product) => <option key={product.id} value={product.id}>{product.name} · system stock {product.stock}</option>)}</select></label><label className="block text-xs font-bold text-ink/55">Physical count<input required type="number" min="0" step="1" value={physicalCount} onChange={(event) => setPhysicalCount(event.target.value)} className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm" /></label>{difference !== null && <div className={`rounded-xl px-4 py-3 text-sm font-bold ${difference === 0 ? "bg-[#f7faf9] text-ink/55" : difference > 0 ? "bg-mint text-leaf" : "bg-red-50 text-red-600"}`}>Difference: {difference > 0 ? "+" : ""}{difference} units</div>}<label className="block text-xs font-bold text-ink/55">Reason<textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full resize-none rounded-xl border border-ink/15 px-3 py-2.5 text-sm" placeholder="Explain the count difference" /></label><button disabled={workingId === "new"} className="w-full rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{workingId === "new" ? "Saving..." : "Submit for approval"}</button></div></form></div>}
    </div>
  );
}

function Status({ value }: { value: string }) {
  const tone = value === "APPROVED" ? "bg-mint text-leaf" : value === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${tone}`}>{value}</span>;
}
