import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus, Search, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getProducts } from "../services/productService";
import { getCustomers } from "../services/customerApi";
import type { Customer } from "../services/customerApi";
import type { Product } from "../types/product";
import {
  FREQUENCY_LABELS,
  createRecurringInvoice,
  getRecurringInvoice,
  updateRecurringInvoice,
} from "../services/recurringInvoiceApi";
import type { RecurringInvoiceFrequency, RecurringInvoicePaymentMethod } from "../services/recurringInvoiceApi";
import { formatCurrency } from "../utils/format";

type CartLine = { productId: string; name: string; unitPrice: number; quantity: number; stock: number };

const PAYMENT_METHODS: RecurringInvoicePaymentMethod[] = ["CASH", "MOBILE_MONEY", "BANK", "CREDIT"];
const FREQUENCIES: RecurringInvoiceFrequency[] = ["WEEKLY", "MONTHLY", "QUARTERLY"];
const todayIso = new Date().toISOString().split("T")[0];

function inputCls() {
  return "w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15";
}

export default function RecurringInvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [frequency, setFrequency] = useState<RecurringInvoiceFrequency>("MONTHLY");
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<RecurringInvoicePaymentMethod>("CREDIT");
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      getProducts(),
      getCustomers({ isActive: true }),
      id ? getRecurringInvoice(id) : Promise.resolve(null),
    ])
      .then(([nextProducts, customerResult, existing]) => {
        if (!alive) return;
        setProducts(nextProducts);
        setCustomers(customerResult.customers);
        if (existing) {
          setCart(
            existing.items.map((item) => {
              const product = nextProducts.find((p) => p.id === item.productId);
              return { productId: item.productId, name: item.productName, unitPrice: item.unitPrice, quantity: item.quantity, stock: product?.stock ?? Infinity };
            }),
          );
          setCustomerId(existing.customerId);
          setFrequency(existing.frequency);
          setStartDate(existing.startDate);
          setEndDate(existing.endDate ?? "");
          setPaymentMethod(existing.paymentMethod);
          setDiscount(String(existing.discount));
          setTaxRate(String(existing.taxRate ?? 0));
          setNotes(existing.notes ?? "");
        }
      })
      .catch((err) => {
        if (alive) setLoadError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [activeProducts, search]);

  const cartQuantity = (productId: string) => cart.find((l) => l.productId === productId)?.quantity ?? 0;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, quantity: 1, stock: product.stock }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0));
  };

  const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cart]);
  const discountNum = Number(discount || 0);
  const taxRateNum = Number(taxRate || 0);
  const taxAmount = Math.round(((subtotal - discountNum) * taxRateNum) / 100 * 100) / 100;
  const netTotal = subtotal - discountNum + taxAmount;

  const handleSubmit = async () => {
    setSubmitError("");
    if (cart.length === 0) {
      setSubmitError("Add at least one product to the invoice.");
      return;
    }
    if (!customerId) {
      setSubmitError("Select a customer for this recurring invoice.");
      return;
    }
    if (discountNum < 0 || discountNum > subtotal) {
      setSubmitError("Discount must be between 0 and the cart subtotal.");
      return;
    }

    const payload = {
      customerId,
      frequency,
      startDate,
      endDate: endDate || null,
      paymentMethod,
      discount: discountNum,
      taxRate: taxRateNum,
      notes: notes.trim() || null,
      items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
    };

    setSubmitting(true);
    try {
      if (id) await updateRecurringInvoice(id, payload);
      else await createRecurringInvoice(payload);
      navigate("/sales/recurring");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <Link to="/sales/recurring" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink">
        <ArrowLeft size={15} aria-hidden="true" /> Back to Recurring Invoices
      </Link>

      <h1 className="mt-4 font-display text-xl font-bold text-ink">{isEdit ? "Edit Recurring Invoice" : "New Recurring Invoice"}</h1>
      <p className="mt-1 text-sm text-ink/50">Pick the products and schedule — BizTrack will generate and record the sale automatically each cycle.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* ── Product picker ── */}
        <section>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU…"
              className={`${inputCls()} pl-11`}
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
              No products match &quot;{search}&quot;.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const qty = cartQuantity(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    className={[
                      "relative flex flex-col items-start rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-leaf/40",
                      qty > 0 ? "border-leaf ring-1 ring-leaf/25" : "border-ink/10",
                    ].join(" ")}
                  >
                    {qty > 0 && (
                      <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-leaf text-xs font-extrabold text-white shadow-sm">
                        {qty}
                      </span>
                    )}
                    <p className="line-clamp-2 text-sm font-bold text-ink">{product.name}</p>
                    <p className="mt-1.5 text-sm font-extrabold text-leaf">{formatCurrency(product.sellingPrice, currency)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Cart + schedule ── */}
        <section className="space-y-4">
          <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-ink">Items</h2>
            {cart.length === 0 ? (
              <p className="rounded-xl bg-[#f7faf9] px-4 py-6 text-center text-sm font-semibold text-ink/40">Tap a product to add it.</p>
            ) : (
              <ul className="space-y-2">
                {cart.map((line) => (
                  <li key={line.productId} className="flex items-center gap-3 rounded-xl bg-[#f7faf9] px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{line.name}</p>
                      <p className="text-xs font-semibold text-ink/45">{formatCurrency(line.unitPrice, currency)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => changeQuantity(line.productId, -1)} className="grid h-7 w-7 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-white" aria-label={`Decrease ${line.name} quantity`}>
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-ink">{line.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(line.productId, 1)} className="grid h-7 w-7 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-white" aria-label={`Increase ${line.name} quantity`}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <p className="w-20 shrink-0 text-right text-sm font-extrabold text-ink">{formatCurrency(line.unitPrice * line.quantity, currency)}</p>
                    <button type="button" onClick={() => removeLine(line.productId)} className="text-ink/30 transition-colors hover:text-red-500" aria-label={`Remove ${line.name}`}>
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-ink">Schedule</h2>

            {submitError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-600">{submitError}</div>
            )}

            <div>
              <label htmlFor="ri-customer" className="mb-1.5 block text-xs font-semibold text-ink/60">
                Customer <span className="text-clay">*</span>
              </label>
              <select id="ri-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls()}>
                <option value="">Select a customer…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-ink/60">Repeats</p>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={["rounded-xl px-3.5 py-2 text-sm font-bold transition-colors", frequency === f ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:bg-[#eef8f4]"].join(" ")}
                  >
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ri-start" className="mb-1.5 block text-xs font-semibold text-ink/60">Starts on</label>
                <input id="ri-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label htmlFor="ri-end" className="mb-1.5 block text-xs font-semibold text-ink/60">Ends on <span className="font-normal text-ink/40">(optional)</span></label>
                <input id="ri-end" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls()} />
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-ink/60">Payment method</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={["rounded-xl px-3.5 py-2 text-sm font-bold transition-colors", paymentMethod === method ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:bg-[#eef8f4]"].join(" ")}
                  >
                    {method.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ri-discount" className="mb-1.5 block text-xs font-semibold text-ink/60">Discount</label>
                <input id="ri-discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label htmlFor="ri-tax" className="mb-1.5 block text-xs font-semibold text-ink/60">Tax / VAT (%)</label>
                <input id="ri-tax" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls()} />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="ri-notes" className="mb-1.5 block text-xs font-semibold text-ink/60">Notes <span className="font-normal text-ink/40">(optional)</span></label>
              <textarea id="ri-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full resize-none rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15" />
            </div>

            <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between font-semibold text-ink/60"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
              {discountNum > 0 && <div className="flex justify-between font-semibold text-ink/60"><span>Discount</span><span>− {formatCurrency(discountNum, currency)}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between font-semibold text-ink/60"><span>Tax</span><span>{formatCurrency(taxAmount, currency)}</span></div>}
              <div className="flex justify-between border-t border-ink/10 pt-1.5 text-base font-extrabold text-ink"><span>Total per cycle</span><span>{formatCurrency(netTotal, currency)}</span></div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create recurring invoice"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
