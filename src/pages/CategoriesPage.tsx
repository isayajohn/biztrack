import { useEffect, useState } from "react";
import { Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/inventoryApi";
import type { Category } from "../services/inventoryApi";

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
  initial?: Category | null;
  onClose: () => void;
  onSaved: () => void;
};

function CategoryModal({ initial, onClose, onSaved }: ModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
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
        await updateCategory(initial.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
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
            {initial ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink/40 hover:bg-[#f4f0e8] hover:text-ink transition-colors"
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
                placeholder="e.g. Electronics"
                className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
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
              {saving ? "Saving…" : initial ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CategoriesPage ───────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleEdit = (cat: Category) => {
    setEditing(cat);
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

  const handleToggleActive = async (cat: Category) => {
    setActionError("");
    try {
      const updated = await updateCategory(cat.id, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleConfirmDelete = async (id: string) => {
    setActionError("");
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
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
          <h1 className="font-display text-xl font-bold text-ink">Categories</h1>
          <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
            {categories.length}
          </span>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-xl bg-leaf px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
        >
          <Plus size={15} aria-hidden="true" />
          New Category
        </button>
      </div>

      {/* Error banner */}
      {(error || actionError) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error || actionError}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading categories…
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f4f0e8] text-ink/30">
            <Tag size={26} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink/45">
            No categories yet. Create your first category.
          </p>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-leaf/90"
          >
            <Plus size={14} aria-hidden="true" />
            New Category
          </button>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/8 bg-[#fbfaf6]">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                  Description
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
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-[#fbfaf6] transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-ink">{cat.name}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {cat.description ?? <span className="text-ink/25">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
                      {cat.productCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => void handleToggleActive(cat)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors ${
                        cat.isActive
                          ? "bg-mint text-leaf hover:bg-leaf/10"
                          : "bg-[#f4f0e8] text-ink/50 hover:bg-ink/10"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deletingId === cat.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => void handleConfirmDelete(cat.id)}
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
                          onClick={() => handleEdit(cat)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-ink/15 text-ink/50 transition-colors hover:bg-[#f4f0e8] hover:text-ink"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-red-200 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${cat.name}`}
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
      )}

      {/* Modal */}
      {showModal && (
        <CategoryModal initial={editing} onClose={handleCloseModal} onSaved={load} />
      )}
    </div>
  );
}
