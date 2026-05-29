import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  LogOut,
  Save,
  Settings,
  Trash2,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, type User } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { updateBusinessProfile } from "../services/authApi";
import { createExpense, deleteExpense, getExpenses } from "../services/expenseService";
import { createProduct, deleteProduct, getProducts } from "../services/productService";
import { createSale, deleteSale, getSales } from "../services/saleService";
import type { Expense } from "../types/expense";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";
import { PAYMENT_METHODS, type PaymentMethod } from "../types/sale";

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", name: "South African Rand" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "TZS", name: "Tanzanian Shilling" },
];

const COUNTRIES = [
  "Tanzania",
  "Kenya",
  "Uganda",
  "Nigeria",
  "Ghana",
  "South Africa",
  "United States",
  "United Kingdom",
  "India",
  "Philippines",
  "Brazil",
  "Mexico",
  "Pakistan",
];

const DATE_FORMATS = [
  { value: "MMM d, yyyy", label: "Jan 31, 2026" },
  { value: "dd/MM/yyyy", label: "31/01/2026" },
  { value: "MM/dd/yyyy", label: "01/31/2026" },
  { value: "yyyy-MM-dd", label: "2026-01-31" },
];

type SettingsFields = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  defaultPaymentMethod: PaymentMethod;
  lowStockAlerts: boolean;
  dateFormat: string;
};

type FieldErrors = Partial<Record<keyof SettingsFields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readSettings(user: User | null): SettingsFields {
  return {
    businessName: user?.businessName ?? "My Business",
    ownerName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    country: user?.country ?? "Tanzania",
    currency: user?.currency ?? "USD",
    defaultPaymentMethod: "Cash",
    lowStockAlerts: true,
    dateFormat: "MMM d, yyyy",
  };
}

function validate(fields: SettingsFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.businessName.trim()) errors.businessName = "Business name is required.";
  if (!fields.ownerName.trim()) errors.ownerName = "Owner name is required.";
  if (!fields.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(fields.email)) errors.email = "Enter a valid email address.";
  if (!fields.phone.trim()) errors.phone = "Phone is required.";
  if (!fields.country) errors.country = "Country is required.";
  if (!fields.currency) errors.currency = "Currency is required.";
  if (!fields.defaultPaymentMethod) {
    errors.defaultPaymentMethod = "Default payment method is required.";
  }
  if (!fields.dateFormat) errors.dateFormat = "Date format is required.";
  return errors;
}

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#fbfaf6] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f4f0e8] text-ink/60">
          <Icon size={17} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs font-semibold text-ink/45">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </label>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [fields, setFields] = useState<SettingsFields>(() => readSettings(user));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [dataMessage, setDataMessage] = useState("");

  const setField =
    <K extends keyof SettingsFields>(key: K) =>
    (value: SettingsFields[K]) => {
      setFields((current) => ({ ...current, [key]: value }));
      if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
      setSuccessMessage("");
    };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(fields);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSuccessMessage("");
      return;
    }

    const cleaned: SettingsFields = {
      ...fields,
      businessName: fields.businessName.trim(),
      ownerName: fields.ownerName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
    };

    try {
      await updateBusinessProfile({
        name: cleaned.businessName,
        ownerName: cleaned.ownerName,
        email: cleaned.email,
        phone: cleaned.phone,
        country: cleaned.country,
        currency: cleaned.currency,
      });
      updateUser({
        businessName: cleaned.businessName,
        name: cleaned.ownerName,
        email: cleaned.email,
        currency: cleaned.currency,
        country: cleaned.country,
      });
      setFields(cleaned);
      setErrors({});
      setSuccessMessage("Settings saved successfully.");
    } catch (err) {
      setSuccessMessage("");
      setDataMessage(getApiErrorMessage(err));
    }
  };

  const handleExportAll = async () => {
    try {
      const [products, sales, expenses] = await Promise.all([
        getProducts(),
        getSales(),
        getExpenses(),
      ]);
      const payload = {
        profile: user,
        products,
        sales,
        expenses,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `biztrack-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setDataMessage("All API data exported.");
    } catch (err) {
      setDataMessage(getApiErrorMessage(err));
    }
  };

  const handleImportClick = () => importInputRef.current?.click();

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        products?: Product[];
        sales?: Sale[];
        expenses?: Expense[];
      };
      for (const product of parsed.products ?? []) {
        await createProduct({
          name: product.name,
          sku: product.sku,
          buyingPrice: product.buyingPrice,
          sellingPrice: product.sellingPrice,
          stock: product.stock,
          lowStockLevel: product.lowStockLevel,
          isActive: product.isActive,
        });
      }
      for (const sale of parsed.sales ?? []) {
        await createSale({
          productId: sale.productId,
          productName: sale.productName,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          saleDate: sale.saleDate,
          notes: sale.notes,
        });
      }
      for (const expense of parsed.expenses ?? []) {
        await createExpense({
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          expenseDate: expense.expenseDate,
          notes: expense.notes,
        });
      }
      setDataMessage("Data imported successfully.");
    } catch (err) {
      setDataMessage(getApiErrorMessage(err));
    } finally {
      event.target.value = "";
    }
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Clear all BizTrack data from the API for this account? This removes products, sales, and expenses.",
    );
    if (!confirmed) return;

    Promise.all([getSales(), getExpenses(), getProducts()])
      .then(async ([sales, expenses, products]) => {
        for (const sale of sales) await deleteSale(sale.id);
        for (const expense of expenses) await deleteExpense(expense.id);
        for (const product of products) await deleteProduct(product.id);
        setDataMessage("API data cleared.");
      })
      .catch((err) => setDataMessage(getApiErrorMessage(err)));
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-xl font-bold text-ink">Settings</h1>
        <span className="rounded-full bg-[#f4f0e8] px-2.5 py-0.5 text-xs font-bold text-ink/60">
          API
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-ink/45">
        Manage your business profile, app defaults, API data, and account session.
      </p>

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-leaf/20 bg-mint px-4 py-3 text-sm font-bold text-leaf">
          <CheckCircle2 size={16} aria-hidden="true" />
          {successMessage}
        </div>
      )}

      <form className="mt-4 grid gap-4" onSubmit={handleSave} noValidate>
        <SectionCard
          title="Business profile"
          subtitle="Shown across your dashboard and reports."
          icon={UserRound}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name" error={errors.businessName}>
              <input
                value={fields.businessName}
                onChange={(event) => setField("businessName")(event.target.value)}
                className={inputCls(!!errors.businessName)}
                placeholder="Mwanzo Mini Market"
              />
            </Field>
            <Field label="Owner name" error={errors.ownerName}>
              <input
                value={fields.ownerName}
                onChange={(event) => setField("ownerName")(event.target.value)}
                className={inputCls(!!errors.ownerName)}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={fields.email}
                onChange={(event) => setField("email")(event.target.value)}
                className={inputCls(!!errors.email)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input
                type="tel"
                value={fields.phone}
                onChange={(event) => setField("phone")(event.target.value)}
                className={inputCls(!!errors.phone)}
                placeholder="+255 700 000 000"
              />
            </Field>
            <Field label="Country" error={errors.country}>
              <select
                value={fields.country}
                onChange={(event) => setField("country")(event.target.value)}
                className={inputCls(!!errors.country)}
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency" error={errors.currency}>
              <select
                value={fields.currency}
                onChange={(event) => setField("currency")(event.target.value)}
                className={inputCls(!!errors.currency)}
              >
                <option value="">Select currency...</option>
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="App preferences"
          subtitle="Defaults used when recording activity."
          icon={Settings}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Default payment method" error={errors.defaultPaymentMethod}>
              <select
                value={fields.defaultPaymentMethod}
                onChange={(event) =>
                  setField("defaultPaymentMethod")(event.target.value as PaymentMethod)
                }
                className={inputCls(!!errors.defaultPaymentMethod)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date format" error={errors.dateFormat}>
              <select
                value={fields.dateFormat}
                onChange={(event) => setField("dateFormat")(event.target.value)}
                className={inputCls(!!errors.dateFormat)}
              >
                {DATE_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-xl border border-ink/10 bg-[#fbfaf6] p-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={fields.lowStockAlerts}
                  onChange={(event) => setField("lowStockAlerts")(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-ink/20 text-leaf focus:ring-leaf/20"
                />
                <span>
                  <span className="block text-sm font-bold text-ink">Low stock alerts</span>
                  <span className="mt-0.5 block text-xs font-semibold leading-5 text-ink/45">
                    Highlight products at or below their alert level.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 sm:w-auto"
          >
            <Save size={16} aria-hidden="true" />
            Save settings
          </button>
        </div>
      </form>

      <div className="mt-4 grid gap-4">
        <SectionCard
          title="Data management"
          subtitle="Move or reset records stored in the backend API."
          icon={WalletCards}
        >
          {dataMessage && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-ink/10 bg-[#fbfaf6] px-4 py-3 text-sm font-bold text-ink/60">
              <AlertTriangle size={16} aria-hidden="true" />
              {dataMessage}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleExportAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
            >
              <Download size={15} aria-hidden="true" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
            >
              <Upload size={15} aria-hidden="true" />
              Import JSON
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 size={15} aria-hidden="true" />
              Clear data
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </SectionCard>

        <SectionCard title="Account" subtitle="End the current local session." icon={LogOut}>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-ink/90 sm:w-auto"
          >
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </SectionCard>
      </div>
    </div>
  );
}
