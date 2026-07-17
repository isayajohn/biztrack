import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getProducts } from "../services/productService";
import { getCustomers } from "../services/customerApi";
import type { Customer } from "../services/customerApi";
import { getPromotions } from "../services/promotionApi";
import type { Promotion } from "../services/promotionApi";
import { getBusinessProfile } from "../services/authApi";
import { createPosSale } from "../services/saleService";
import { PAYMENT_METHODS } from "../types/sale";
import type { PaymentMethod, Sale } from "../types/sale";
import type { Product } from "../types/product";
import { computeSaleTotals } from "../utils/saleTotals";
import { formatCurrency } from "../utils/format";

type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

function inputCls() {
  return "w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15";
}

const todayIso = new Date().toISOString().split("T")[0];

export default function PosPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successSale, setSuccessSale] = useState<Sale | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getProducts(), getCustomers({ isActive: true }), getPromotions(true), getBusinessProfile()])
      .then(([nextProducts, customerResult, nextPromotions, business]) => {
        if (!alive) return;
        setProducts(nextProducts);
        setCustomers(customerResult.customers);
        setPromotions(nextPromotions);
        setDefaultTaxRate(business.defaultTaxRate ?? 0);
        setTaxRate(String(business.defaultTaxRate ?? 0));
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
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const flash = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2500);
  };

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }, [activeProducts, search]);

  const cartQuantity = (productId: string) => cart.find((l) => l.productId === productId)?.quantity ?? 0;

  const addToCart = (product: Product) => {
    const inCart = cartQuantity(product.id);
    if (inCart >= product.stock) {
      flash(`Only ${product.stock} in stock for ${product.name}`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, quantity: 1, stock: product.stock }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const nextQty = l.quantity + delta;
          if (delta > 0 && nextQty > l.stock) {
            flash(`Only ${l.stock} in stock for ${l.name}`);
            return l;
          }
          return { ...l, quantity: nextQty };
        })
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = search.trim().toLowerCase();
    if (!code) return;
    const matches = activeProducts.filter(
      (p) => p.barcode?.toLowerCase() === code || p.sku?.toLowerCase() === code,
    );
    if (matches.length === 1) {
      addToCart(matches[0]);
      setSearch("");
    }
  };

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cart]);
  const discountNum = Number(discount || 0);
  const taxRateNum = Number(taxRate || 0);
  const selectedPromotion = promotions.find((p) => p.id === promotionId);
  const { promotionDiscount, taxAmount, netTotal } = computeSaleTotals(subtotal, discountNum, selectedPromotion, taxRateNum);
  const paidNum = paidAmount === "" && paymentMethod !== "Credit" ? netTotal : Number(paidAmount || 0);
  const balanceDue = Math.max(0, netTotal - paidNum);

  const handlePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setPaidAmount(method === "Credit" ? "0" : "");
  };

  const resetCheckout = () => {
    setCart([]);
    setCustomerId("");
    setPromotionId("");
    setDiscount("0");
    setTaxRate(String(defaultTaxRate));
    setPaymentMethod("Cash");
    setPaidAmount("");
    setPaymentDueDate("");
    setShowMoreOptions(false);
    searchRef.current?.focus();
  };

  const handleCheckout = async () => {
    setSubmitError("");
    if (cart.length === 0) return;
    if (discountNum < 0 || discountNum > subtotal) {
      setSubmitError("Discount must be between 0 and the cart subtotal.");
      return;
    }
    if (paidNum < 0 || paidNum > netTotal) {
      setSubmitError("Paid amount cannot exceed the amount due.");
      return;
    }
    if (balanceDue > 0 && !customerId) {
      setSubmitError("Select a customer for an unpaid or credit sale.");
      return;
    }

    setSubmitting(true);
    try {
      const sale = await createPosSale({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
        customerId: customerId || undefined,
        promotionId: promotionId || undefined,
        discount: discountNum,
        taxRate: taxRateNum,
        paidAmount: paidNum,
        paymentDueDate: balanceDue > 0 ? paymentDueDate || undefined : undefined,
        paymentMethod,
        saleDate: todayIso,
      });
      setSuccessSale(sale);
      resetCheckout();
      getProducts().then(setProducts).catch(() => undefined);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading POS...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Point of Sale</h1>
          <p className="mt-1 text-sm text-ink/50">Search or scan a product to add it to the cart.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* ── Product browser ── */}
        <section>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by name, SKU or scan a barcode…"
              className={`${inputCls()} pl-11`}
            />
          </div>

          {notice && (
            <div className="mt-3 rounded-xl border border-clay/30 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-clay">
              {notice}
            </div>
          )}

          {products.length === 0 ? (
            <div className="mt-5 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
              No products found. Add a product first before using the POS.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
              No products match &quot;{search}&quot;.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const qty = cartQuantity(product.id);
                const outOfStock = product.stock <= 0;
                const atCap = qty >= product.stock;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={outOfStock || atCap}
                    className={[
                      "relative flex flex-col items-start rounded-xl border bg-white p-3 text-left shadow-sm transition-all",
                      qty > 0 ? "border-leaf ring-1 ring-leaf/25" : "border-ink/10",
                      outOfStock || atCap ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5 hover:border-leaf/40",
                    ].join(" ")}
                  >
                    {qty > 0 && (
                      <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-leaf text-xs font-extrabold text-white shadow-sm">
                        {qty}
                      </span>
                    )}
                    <p className="line-clamp-2 text-sm font-bold text-ink">{product.name}</p>
                    <p className="mt-1.5 text-sm font-extrabold text-leaf">{formatCurrency(product.sellingPrice, currency)}</p>
                    <p className={`mt-0.5 text-xs font-semibold ${outOfStock ? "text-red-600" : "text-ink/40"}`}>
                      {outOfStock ? "Out of stock" : `${product.stock} left`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Cart + checkout ── */}
        <section className="space-y-4">
          {successSale ? (
            <div className="rounded-xl border border-leaf/30 bg-mint p-5 shadow-sm">
              <div className="flex items-center gap-2 text-leaf">
                <CheckCircle2 size={22} aria-hidden="true" />
                <p className="font-display text-base font-extrabold text-ink">Sale completed</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink/70">
                Receipt {successSale.receiptNumber ?? successSale.id.slice(0, 8)} ·{" "}
                {formatCurrency(successSale.totalAmount - successSale.discount - successSale.promotionDiscount + successSale.taxAmount, currency)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSuccessSale(null)}
                  className="rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
                >
                  New sale
                </button>
                <a
                  href={`/sales/${successSale.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-white"
                >
                  View receipt
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Cart */}
              <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                  <ShoppingCart size={16} aria-hidden="true" />
                  Cart
                </h2>
                {cart.length === 0 ? (
                  <p className="rounded-xl bg-[#f7faf9] px-4 py-6 text-center text-sm font-semibold text-ink/40">
                    Cart is empty — tap a product to add it.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {cart.map((line) => (
                      <li key={line.productId} className="flex items-center gap-3 rounded-xl bg-[#f7faf9] px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{line.name}</p>
                          <p className="text-xs font-semibold text-ink/45">{formatCurrency(line.unitPrice, currency)} each</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.productId, -1)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-white"
                            aria-label={`Decrease ${line.name} quantity`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-ink">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.productId, 1)}
                            disabled={line.quantity >= line.stock}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Increase ${line.name} quantity`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <p className="w-20 shrink-0 text-right text-sm font-extrabold text-ink">
                          {formatCurrency(line.unitPrice * line.quantity, currency)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeLine(line.productId)}
                          className="text-ink/30 transition-colors hover:text-red-500"
                          aria-label={`Remove ${line.name} from cart`}
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Checkout */}
              <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-ink">Checkout</h2>

                {submitError && (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-600">
                    {submitError}
                  </div>
                )}

                <p className="mb-2 text-sm font-semibold text-ink">Payment method</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handlePaymentMethod(method)}
                      className={[
                        "rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                        paymentMethod === method ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:bg-[#eef8f4]",
                      ].join(" ")}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMoreOptions((v) => !v)}
                  className="mt-4 flex items-center gap-1.5 text-sm font-bold text-leaf"
                >
                  <ChevronDown size={15} className={`transition-transform ${showMoreOptions ? "rotate-180" : ""}`} aria-hidden="true" />
                  {showMoreOptions ? "Hide" : "Add"} customer, discount or promotion
                </button>

                {showMoreOptions && (
                  <div className="mt-3 space-y-3 border-t border-ink/10 pt-3">
                    <div>
                      <label htmlFor="pos-customer" className="mb-1.5 block text-xs font-semibold text-ink/60">
                        Customer <span className="font-normal text-ink/40">(required for credit)</span>
                      </label>
                      <select id="pos-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls()}>
                        <option value="">Walk-in customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} · owing {formatCurrency(customer.creditBalance, currency)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {promotions.length > 0 && (
                      <div>
                        <label htmlFor="pos-promotion" className="mb-1.5 block text-xs font-semibold text-ink/60">
                          Promotion <span className="font-normal text-ink/40">(optional)</span>
                        </label>
                        <select id="pos-promotion" value={promotionId} onChange={(e) => setPromotionId(e.target.value)} className={inputCls()}>
                          <option value="">No promotion</option>
                          {promotions.map((promotion) => (
                            <option key={promotion.id} value={promotion.id}>
                              {promotion.code} · {promotion.type === "PERCENTAGE" ? `${promotion.value}% off` : `${promotion.value} off`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="pos-discount" className="mb-1.5 block text-xs font-semibold text-ink/60">Discount</label>
                        <input id="pos-discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls()} />
                      </div>
                      <div>
                        <label htmlFor="pos-tax" className="mb-1.5 block text-xs font-semibold text-ink/60">Tax / VAT (%)</label>
                        <input id="pos-tax" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls()} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="pos-paid" className="mb-1.5 block text-xs font-semibold text-ink/60">Amount paid</label>
                      <input
                        id="pos-paid"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={String(netTotal)}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className={inputCls()}
                      />
                    </div>

                    {balanceDue > 0 && (
                      <div>
                        <label htmlFor="pos-due-date" className="mb-1.5 block text-xs font-semibold text-ink/60">Payment due date</label>
                        <input
                          id="pos-due-date"
                          type="date"
                          min={todayIso}
                          value={paymentDueDate}
                          onChange={(e) => setPaymentDueDate(e.target.value)}
                          className={inputCls()}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
                  <div className="flex justify-between font-semibold text-ink/60"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
                  {discountNum > 0 && <div className="flex justify-between font-semibold text-ink/60"><span>Discount</span><span>− {formatCurrency(discountNum, currency)}</span></div>}
                  {promotionDiscount > 0 && <div className="flex justify-between font-semibold text-ink/60"><span>Promotion</span><span>− {formatCurrency(promotionDiscount, currency)}</span></div>}
                  {taxAmount > 0 && <div className="flex justify-between font-semibold text-ink/60"><span>Tax</span><span>{formatCurrency(taxAmount, currency)}</span></div>}
                  <div className="flex justify-between border-t border-ink/10 pt-1.5 text-base font-extrabold text-ink"><span>Total</span><span>{formatCurrency(netTotal, currency)}</span></div>
                  {balanceDue > 0 && <div className="flex justify-between font-bold text-red-600"><span>Balance due</span><span>{formatCurrency(balanceDue, currency)}</span></div>}
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || submitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {submitting ? "Processing…" : `Complete Sale · ${formatCurrency(netTotal, currency)}`}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
