import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../services/productService";
import { getCategories, getSuppliers } from "../services/inventoryApi";
import type { Category, Supplier } from "../services/inventoryApi";
import { getApiErrorMessage } from "../services/apiClient";
import type { ProductFormData } from "../types/product";
import { formatCurrency } from "../utils/format";

// ─── Validation ───────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof ProductFormData, string>>;

function validate(f: ProductFormData): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) {
    e.name = "Product name is required.";
  } else if (f.name.trim().length < 2) {
    e.name = "Name must be at least 2 characters.";
  }

  const buy = parseFloat(f.buyingPrice);
  if (f.buyingPrice === "" || isNaN(buy)) {
    e.buyingPrice = "Valid buying price is required.";
  } else if (buy < 0) {
    e.buyingPrice = "Buying price cannot be negative.";
  }

  const sell = parseFloat(f.sellingPrice);
  if (f.sellingPrice === "" || isNaN(sell)) {
    e.sellingPrice = "Valid selling price is required.";
  } else if (sell < 0) {
    e.sellingPrice = "Selling price cannot be negative.";
  }

  const stock = Number(f.stock);
  if (f.stock === "" || isNaN(stock)) {
    e.stock = "Stock quantity is required.";
  } else if (!Number.isInteger(stock) || stock < 0) {
    e.stock = "Stock must be a whole number of 0 or more.";
  }

  const low = Number(f.lowStockLevel);
  if (f.lowStockLevel === "" || isNaN(low)) {
    e.lowStockLevel = "Low stock level is required.";
  } else if (!Number.isInteger(low) || low < 0) {
    e.lowStockLevel = "Must be a whole number of 0 or more.";
  }

  return e;
}

// ─── Input class helper ───────────────────────────────────────────────────────

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none",
    "transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#fbfaf6] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM: ProductFormData = {
  name: "",
  sku: "",
  categoryId: "",
  supplierId: "",
  buyingPrice: "",
  sellingPrice: "",
  stock: "",
  lowStockLevel: "5",
  isActive: true,
};

// ─── ProductFormPage ──────────────────────────────────────────────────────────

type EmbeddedFormProps = {
  embedded?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
};

export default function ProductFormPage({ embedded = false, onClose, onSaved }: EmbeddedFormProps = {}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [fields, setFields] = useState<ProductFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [submitError, setSubmitError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load categories and suppliers for dropdowns
  useEffect(() => {
    Promise.all([getCategories(), getSuppliers()])
      .then(([cats, sups]) => {
        setCategories(cats.filter((c) => c.isActive));
        setSuppliers(sups.filter((s) => s.isActive));
      })
      .catch(() => {});
  }, []);

  // Load existing product for edit
  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    setIsLoading(true);
    getProductById(id)
      .then((product) => {
        if (!alive) return;
        if (!product) {
          setNotFound(true);
          return;
        }
        setFields({
          name: product.name,
          sku: product.sku ?? "",
          categoryId: product.categoryId ?? "",
          supplierId: product.supplierId ?? "",
          buyingPrice: String(product.buyingPrice),
          sellingPrice: String(product.sellingPrice),
          stock: String(product.stock),
          lowStockLevel: String(product.lowStockLevel),
          isActive: product.isActive,
        });
      })
      .catch(() => {
        if (alive) setNotFound(true);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  // Redirect if product not found
  useEffect(() => {
    if (notFound) navigate("/products", { replace: true });
  }, [notFound, navigate]);

  // Live profit margin preview
  const buyNum = parseFloat(fields.buyingPrice);
  const sellNum = parseFloat(fields.sellingPrice);
  const hasValidPrices = !isNaN(buyNum) && !isNaN(sellNum);
  const margin = hasValidPrices ? sellNum - buyNum : null;
  const marginPct =
    hasValidPrices && buyNum > 0
      ? ((margin! / buyNum) * 100).toFixed(1)
      : null;

  // Field updater for inputs
  const set =
    (key: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === "isActive" ? e.target.checked : e.target.value;
      setFields((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  // Field updater for selects
  const setSelect =
    (key: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError("");
    setIsSaving(true);
    try {
      const data = {
        name: fields.name.trim(),
        sku: fields.sku.trim() || undefined,
        categoryId: fields.categoryId || null,
        supplierId: fields.supplierId || null,
        buyingPrice: parseFloat(fields.buyingPrice),
        sellingPrice: parseFloat(fields.sellingPrice),
        stock: parseInt(fields.stock, 10),
        lowStockLevel: parseInt(fields.lowStockLevel, 10),
        isActive: fields.isActive,
      };
      if (isEdit) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      if (embedded && !isEdit) {
        onSaved?.();
      } else {
        navigate("/products");
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading product...
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "mx-auto max-w-2xl px-1 pb-2" : "mx-auto max-w-2xl px-4 py-5 sm:px-6"}>
      {/* Back link */}
      {embedded ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Close
        </button>
      ) : (
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Products
        </Link>
      )}

      {/* Title */}
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">
        {isEdit ? "Edit Product" : "Add Product"}
      </h1>
      <p className="mt-1 text-sm text-ink/50">
        {isEdit
          ? "Update the product details below."
          : "Fill in the details to add a new product."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {submitError}
          </div>
        )}
        {/* ── Basic info card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Product details</h2>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Product name <span className="text-clay">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Rice 5kg bags"
              value={fields.name}
              onChange={set("name")}
              className={inputCls(!!errors.name)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-err" : undefined}
            />
            {errors.name && (
              <p id="name-err" className="mt-1 text-xs font-medium text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* SKU */}
          <div className="mt-4">
            <label
              htmlFor="sku"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              SKU{" "}
              <span className="font-normal text-ink/40">(optional)</span>
            </label>
            <input
              id="sku"
              type="text"
              placeholder="e.g. RICE-5KG"
              value={fields.sku}
              onChange={set("sku")}
              className={inputCls()}
            />
          </div>

          {/* Category + Supplier */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Category{" "}
                <span className="font-normal text-ink/40">(optional)</span>
              </label>
              <select
                id="categoryId"
                value={fields.categoryId}
                onChange={setSelect("categoryId")}
                className={inputCls()}
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="supplierId"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Supplier{" "}
                <span className="font-normal text-ink/40">(optional)</span>
              </label>
              <select
                id="supplierId"
                value={fields.supplierId}
                onChange={setSelect("supplierId")}
                className={inputCls()}
              >
                <option value="">— No supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Pricing card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Buying price */}
            <div>
              <label
                htmlFor="buyingPrice"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Buying price <span className="text-clay">*</span>
              </label>
              <input
                id="buyingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={fields.buyingPrice}
                onChange={set("buyingPrice")}
                className={inputCls(!!errors.buyingPrice)}
                aria-invalid={!!errors.buyingPrice}
                aria-describedby={errors.buyingPrice ? "buy-err" : undefined}
              />
              {errors.buyingPrice && (
                <p id="buy-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.buyingPrice}
                </p>
              )}
            </div>

            {/* Selling price */}
            <div>
              <label
                htmlFor="sellingPrice"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Selling price <span className="text-clay">*</span>
              </label>
              <input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={fields.sellingPrice}
                onChange={set("sellingPrice")}
                className={inputCls(!!errors.sellingPrice)}
                aria-invalid={!!errors.sellingPrice}
                aria-describedby={errors.sellingPrice ? "sell-err" : undefined}
              />
              {errors.sellingPrice && (
                <p id="sell-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.sellingPrice}
                </p>
              )}
            </div>
          </div>

          {/* Live margin preview */}
          {hasValidPrices && (
            <div
              className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 ${
                margin! >= 0
                  ? "bg-mint"
                  : "bg-red-50"
              }`}
            >
              <p className="text-xs font-semibold text-ink/55">
                Profit margin (preview)
              </p>
              <p
                className={`text-sm font-bold ${
                  margin! >= 0 ? "text-leaf" : "text-clay"
                }`}
              >
                {margin! >= 0 ? "+" : ""}
                {formatCurrency(margin!)}
                {marginPct !== null && (
                  <span className="ml-1 font-semibold opacity-70">
                    ({marginPct}%)
                  </span>
                )}
              </p>
            </div>
          )}
        </section>

        {/* ── Inventory card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Inventory</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Stock quantity */}
            <div>
              <label
                htmlFor="stock"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Stock quantity <span className="text-clay">*</span>
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={fields.stock}
                onChange={set("stock")}
                className={inputCls(!!errors.stock)}
                aria-invalid={!!errors.stock}
                aria-describedby={errors.stock ? "stock-err" : undefined}
              />
              {errors.stock && (
                <p id="stock-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.stock}
                </p>
              )}
            </div>

            {/* Low stock level */}
            <div>
              <label
                htmlFor="lowStockLevel"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Low stock level <span className="text-clay">*</span>
              </label>
              <input
                id="lowStockLevel"
                type="number"
                min="0"
                step="1"
                placeholder="5"
                value={fields.lowStockLevel}
                onChange={set("lowStockLevel")}
                className={inputCls(!!errors.lowStockLevel)}
                aria-invalid={!!errors.lowStockLevel}
                aria-describedby={errors.lowStockLevel ? "low-err" : undefined}
              />
              {errors.lowStockLevel && (
                <p id="low-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.lowStockLevel}
                </p>
              )}
              <p className="mt-1 text-xs text-ink/40">
                Warn when stock falls to or below this number.
              </p>
            </div>
          </div>
        </section>

        {/* ── Status card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink">Active status</p>
              <p className="mt-0.5 text-xs text-ink/45">
                Inactive products are hidden from sales and reports.
              </p>
            </div>
            {/* Toggle */}
            <div className="relative shrink-0">
              <input
                id="isActive"
                type="checkbox"
                checked={fields.isActive}
                onChange={set("isActive")}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  fields.isActive ? "bg-leaf" : "bg-ink/20"
                }`}
              />
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  fields.isActive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>
        </section>

        {/* ── Action buttons ── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {embedded ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
            >
              Cancel
            </button>
          ) : (
            <Link
              to="/products"
              className="flex items-center justify-center rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
            >
              Cancel
            </Link>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-xl bg-leaf px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60"
          >
            {isSaving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}
