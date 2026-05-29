import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createSale,
  getSaleById,
  updateSale,
} from "../services/saleService";
import { getProducts } from "../services/productService";
import { getApiErrorMessage } from "../services/apiClient";
import type { SaleFormData, PaymentMethod } from "../types/sale";
import { PAYMENT_METHODS } from "../types/sale";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";
import { formatCurrency } from "../utils/format";

// ─── Validation ───────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof SaleFormData, string>>;

function validate(
  f: SaleFormData,
  effectiveStock: number,
): FormErrors {
  const e: FormErrors = {};

  if (!f.productId) {
    e.productId = "Please select a product.";
  }

  const qty = parseInt(f.quantity, 10);
  if (f.quantity === "" || isNaN(qty)) {
    e.quantity = "Quantity is required.";
  } else if (qty <= 0) {
    e.quantity = "Quantity must be greater than 0.";
  } else if (qty > effectiveStock) {
    e.quantity = `Only ${effectiveStock} unit${effectiveStock !== 1 ? "s" : ""} available in stock.`;
  }

  const price = parseFloat(f.unitPrice);
  if (f.unitPrice === "" || isNaN(price)) {
    e.unitPrice = "Unit price is required.";
  } else if (price <= 0) {
    e.unitPrice = "Unit price must be greater than 0.";
  }

  if (!f.saleDate) {
    e.saleDate = "Sale date is required.";
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

// ─── Default form state ───────────────────────────────────────────────────────

const todayIso = new Date().toISOString().split("T")[0];

const EMPTY_FORM: SaleFormData = {
  productId: "",
  quantity: "",
  unitPrice: "",
  paymentMethod: "Cash",
  saleDate: todayIso,
  notes: "",
};

// ─── SaleFormPage ─────────────────────────────────────────────────────────────

export default function SaleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [products, setProducts] = useState<Product[]>([]);
  const [fields, setFields] = useState<SaleFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [originalSale, setOriginalSale] = useState<Sale | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    Promise.all([getProducts(), isEdit ? getSaleById(id) : Promise.resolve(undefined)])
      .then(([nextProducts, sale]) => {
        if (!alive) return;
        setProducts(nextProducts);
        if (isEdit) {
          if (!sale) {
            setNotFound(true);
            return;
          }
          setOriginalSale(sale);
          setFields({
            productId: sale.productId,
            quantity: String(sale.quantity),
            unitPrice: String(sale.unitPrice),
            paymentMethod: sale.paymentMethod,
            saleDate: sale.saleDate,
            notes: sale.notes ?? "",
          });
        }
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

  // Redirect if sale not found
  useEffect(() => {
    if (notFound) navigate("/sales", { replace: true });
  }, [notFound, navigate]);

  // Selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === fields.productId) ?? null,
    [products, fields.productId],
  );

  // Effective stock available for quantity validation
  // If editing the same product, restore the original quantity to available stock
  const effectiveStock = useMemo(() => {
    if (!selectedProduct) return 0;
    if (isEdit && originalSale && originalSale.productId === fields.productId) {
      return selectedProduct.stock + originalSale.quantity;
    }
    return selectedProduct.stock;
  }, [selectedProduct, isEdit, originalSale, fields.productId]);

  // Computed total amount preview
  const qtyNum = parseInt(fields.quantity, 10);
  const priceNum = parseFloat(fields.unitPrice);
  const computedTotal =
    !isNaN(qtyNum) && !isNaN(priceNum) && qtyNum > 0 && priceNum > 0
      ? qtyNum * priceNum
      : null;

  // Handle product selection — auto-fill unit price
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFields((prev) => ({
      ...prev,
      productId,
      unitPrice: product ? String(product.sellingPrice) : prev.unitPrice,
      quantity: "", // reset quantity when product changes
    }));
    setErrors((prev) => ({
      ...prev,
      productId: undefined,
      unitPrice: undefined,
      quantity: undefined,
    }));
  };

  // Generic field updater
  const setField =
    (key: keyof SaleFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const setPaymentMethod = (method: PaymentMethod) => {
    setFields((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields, effectiveStock);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError("");
    setIsSaving(true);

    try {
      const qty = parseInt(fields.quantity, 10);
      const price = parseFloat(fields.unitPrice);
      const product = products.find((p) => p.id === fields.productId)!;

      const data = {
        productId: fields.productId,
        productName: product.name,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        paymentMethod: fields.paymentMethod,
        saleDate: fields.saleDate,
        notes: fields.notes.trim() || undefined,
      };

      if (isEdit) {
        await updateSale(id, data);
      } else {
        await createSale(data);
      }

      navigate("/sales");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const activeProducts = products.filter((p) => p.isActive);
  // When editing, also include the original product if it's now inactive
  const selectorProducts = useMemo(() => {
    if (!isEdit || !originalSale) return activeProducts;
    const originalInList = activeProducts.some(
      (p) => p.id === originalSale.productId,
    );
    if (originalInList) return activeProducts;
    const original = products.find((p) => p.id === originalSale.productId);
    return original ? [...activeProducts, original] : activeProducts;
  }, [activeProducts, isEdit, originalSale, products]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading sale details...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
      {/* Back link */}
      <Link
        to="/sales"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Sales
      </Link>

      {/* Title */}
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">
        {isEdit ? "Edit Sale" : "Record Sale"}
      </h1>
      <p className="mt-1 text-sm text-ink/50">
        {isEdit
          ? "Update the sale details below."
          : "Fill in the details to record a new sale."}
      </p>

      {/* No products warning */}
      {products.length === 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <p className="text-sm font-semibold text-amber-700">
            No products found.{" "}
            <Link to="/products/new" className="underline">
              Add a product first
            </Link>{" "}
            before recording a sale.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {submitError}
          </div>
        )}
        {/* ── Sale details card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Sale details</h2>

          {/* Product selector */}
          <div>
            <label
              htmlFor="productId"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Product <span className="text-clay">*</span>
            </label>
            <select
              id="productId"
              value={fields.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className={inputCls(!!errors.productId)}
              aria-invalid={!!errors.productId}
              aria-describedby={errors.productId ? "product-err" : undefined}
            >
              <option value="">Select a product…</option>
              {selectorProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!p.isActive ? " (inactive)" : ""}
                </option>
              ))}
            </select>
            {errors.productId && (
              <p
                id="product-err"
                className="mt-1 text-xs font-medium text-red-500"
              >
                {errors.productId}
              </p>
            )}
          </div>

          {/* Quantity + Unit price */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Quantity <span className="text-clay">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={fields.quantity}
                onChange={setField("quantity")}
                className={inputCls(!!errors.quantity)}
                aria-invalid={!!errors.quantity}
                aria-describedby={errors.quantity ? "qty-err" : undefined}
              />
              {selectedProduct && (
                <p className="mt-1 text-xs text-ink/40">
                  Available:{" "}
                  <span
                    className={
                      effectiveStock === 0 ? "font-bold text-clay" : "font-semibold text-ink/60"
                    }
                  >
                    {effectiveStock} unit{effectiveStock !== 1 ? "s" : ""}
                  </span>
                </p>
              )}
              {errors.quantity && (
                <p
                  id="qty-err"
                  className="mt-1 text-xs font-medium text-red-500"
                >
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Unit price */}
            <div>
              <label
                htmlFor="unitPrice"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Unit price <span className="text-clay">*</span>
              </label>
              <input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={fields.unitPrice}
                onChange={setField("unitPrice")}
                className={inputCls(!!errors.unitPrice)}
                aria-invalid={!!errors.unitPrice}
                aria-describedby={errors.unitPrice ? "price-err" : undefined}
              />
              {selectedProduct && (
                <p className="mt-1 text-xs text-ink/40">
                  Selling price:{" "}
                  <span className="font-semibold text-ink/60">
                    {formatCurrency(selectedProduct.sellingPrice)}
                  </span>
                </p>
              )}
              {errors.unitPrice && (
                <p
                  id="price-err"
                  className="mt-1 text-xs font-medium text-red-500"
                >
                  {errors.unitPrice}
                </p>
              )}
            </div>
          </div>

          {/* Total amount preview */}
          {computedTotal !== null && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-mint px-4 py-3">
              <p className="text-xs font-semibold text-ink/55">
                Total amount
              </p>
              <p className="text-base font-bold text-leaf">
                {formatCurrency(computedTotal)}
              </p>
            </div>
          )}
        </section>

        {/* ── Payment & date card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Payment & date</h2>

          {/* Payment method */}
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              Payment method <span className="text-clay">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={[
                    "rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                    fields.paymentMethod === method
                      ? "bg-ink text-white"
                      : "border border-ink/15 text-ink/60 hover:bg-[#f4f0e8]",
                  ].join(" ")}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Sale date */}
          <div className="mt-4">
            <label
              htmlFor="saleDate"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Sale date <span className="text-clay">*</span>
            </label>
            <input
              id="saleDate"
              type="date"
              value={fields.saleDate}
              onChange={setField("saleDate")}
              max={todayIso}
              className={inputCls(!!errors.saleDate)}
              aria-invalid={!!errors.saleDate}
              aria-describedby={errors.saleDate ? "date-err" : undefined}
            />
            {errors.saleDate && (
              <p
                id="date-err"
                className="mt-1 text-xs font-medium text-red-500"
              >
                {errors.saleDate}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Notes{" "}
              <span className="font-normal text-ink/40">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Regular customer, credit to collect Friday…"
              value={fields.notes}
              onChange={setField("notes")}
              className="w-full resize-none rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            />
          </div>
        </section>

        {/* ── Action buttons ── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/sales"
            className="flex items-center justify-center rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving || products.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-leaf px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60"
          >
            {isSaving && (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            )}
            {isSaving
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Record sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
