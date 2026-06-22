import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Truck, X } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/inventoryApi";
import type { Supplier } from "../services/inventoryApi";
import { formatCurrency } from "../utils/format";

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
  initial?: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
};

function SupplierModal({ initial, onClose, onSaved }: ModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (initial) {
        await updateSupplier(initial.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        });
      } else {
        await createSupplier({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        });
      }
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
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-base font-bold text-ink">
            {initial ? "Edit Supplier" : "New Supplier"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink/40 transition-colors hover:bg-[#f4f0e8] hover:text-ink"
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
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Name <span className="text-clay">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Supplier name"
                className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 700 000 000"
                className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supplier@example.com"
                className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical address"
                rows={2}
                className="w-full resize-none rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save Changes" : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SuppliersPage ────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      setSuppliers(await getSuppliers());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleEdit = (s: Supplier) => {
    setEditing(s);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleConfirmDelete = async (id: string) => {
    setActionError("");
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
    setDeletingId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Suppliers</h1>
          <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {suppliers.length}
          </span>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
        >
          <Plus size={15} aria-hidden="true" />
          New Supplier
        </button>
      </div>

      {/* Error */}
      {(error || actionError) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error || actionError}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading suppliers…
        </div>
      ) : suppliers.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f4f0e8] text-ink/30">
            <Truck size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">
            No suppliers yet. Add your first supplier.
          </p>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-leaf/90"
          >
            <Plus size={14} aria-hidden="true" />
            New Supplier
          </button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/8 bg-[#fbfaf6]">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink/45">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink/45">
                    Products
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink/45">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink/45">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink/5 last:border-b-0 transition-colors hover:bg-[#fbfaf6]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{s.name}</p>
                      {s.address && (
                        <p className="text-xs text-ink/40">{s.address}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {s.phone ?? <span className="text-ink/25">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {s.email ?? <span className="text-ink/25">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold ${s.balance > 0 ? "text-clay" : "text-ink"}`}
                      >
                        {formatCurrency(s.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
                        {s.productCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          s.isActive ? "bg-mint text-leaf" : "bg-[#f4f0e8] text-ink/50"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deletingId === s.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => void handleConfirmDelete(s.id)}
                            className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="rounded-lg border border-ink/15 px-2 py-1 text-xs font-bold text-ink/50 transition-colors hover:bg-[#f4f0e8]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(s)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-ink/15 text-ink/50 transition-colors hover:bg-[#f4f0e8] hover:text-ink"
                            aria-label={`Edit ${s.name}`}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeletingId(s.id)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-red-200 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${s.name}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col divide-y divide-ink/5 lg:hidden">
            {suppliers.map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{s.name}</p>
                    {s.phone && <p className="text-xs text-ink/55">{s.phone}</p>}
                    {s.email && <p className="text-xs text-ink/55">{s.email}</p>}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.isActive ? "bg-mint text-leaf" : "bg-[#f4f0e8] text-ink/50"
                    }`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-ink/60">
                  <span>
                    Balance:{" "}
                    <span className={`font-bold ${s.balance > 0 ? "text-clay" : "text-ink"}`}>
                      {formatCurrency(s.balance)}
                    </span>
                  </span>
                  <span>Products: {s.productCount}</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-ink/5 pt-3">
                  <button
                    onClick={() => handleEdit(s)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/15 py-2 text-xs font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
                  >
                    <Pencil size={12} aria-hidden="true" />
                    Edit
                  </button>
                  {deletingId === s.id ? (
                    <>
                      <button
                        onClick={() => void handleConfirmDelete(s.id)}
                        className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="flex-1 rounded-xl border border-ink/15 py-2 text-xs font-bold text-ink/50 transition-colors hover:bg-[#f4f0e8]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeletingId(s.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SupplierModal initial={editing} onClose={handleCloseModal} onSaved={load} />
      )}
    </div>
  );
}
