import { useEffect, useMemo, useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Save,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createAdminPackage,
  getAdminPackage,
  updateAdminPackage,
} from "../../services/adminApi";
import type { AdminPackage, PackagePayload, PackageStatus } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type FormState = {
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  trialDays: string;
  maxBusinesses: string;
  maxUsers: string;
  maxProducts: string;
  maxSalesPerMonth: string;
  maxExpensesPerMonth: string;
  allowReports: boolean;
  allowPdfExport: boolean;
  allowCsvExport: boolean;
  allowInventoryAlerts: boolean;
  allowAiInsights: boolean;
  status: PackageStatus;
  sortOrder: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "",
  currency: "USD",
  trialDays: "0",
  maxBusinesses: "1",
  maxUsers: "1",
  maxProducts: "50",
  maxSalesPerMonth: "500",
  maxExpensesPerMonth: "500",
  allowReports: true,
  allowPdfExport: false,
  allowCsvExport: true,
  allowInventoryAlerts: false,
  allowAiInsights: false,
  status: "ACTIVE",
  sortOrder: "0",
};

const limitFields: Array<{ key: keyof Pick<
  FormState,
  "maxBusinesses" | "maxUsers" | "maxProducts" | "maxSalesPerMonth" | "maxExpensesPerMonth"
>; label: string }> = [
  { key: "maxBusinesses", label: "Max businesses" },
  { key: "maxUsers", label: "Max users" },
  { key: "maxProducts", label: "Max products" },
  { key: "maxSalesPerMonth", label: "Max sales per month" },
  { key: "maxExpensesPerMonth", label: "Max expenses per month" },
];

const featureFields: Array<{ key: keyof Pick<
  FormState,
  "allowReports" | "allowPdfExport" | "allowCsvExport" | "allowInventoryAlerts" | "allowAiInsights"
>; label: string; description: string }> = [
  { key: "allowReports", label: "Reports", description: "Allow advanced report pages." },
  { key: "allowPdfExport", label: "PDF export", description: "Allow PDF report exports." },
  { key: "allowCsvExport", label: "CSV export", description: "Allow spreadsheet exports." },
  { key: "allowInventoryAlerts", label: "Inventory alerts", description: "Show low-stock warnings." },
  { key: "allowAiInsights", label: "AI insights", description: "Allow AI business summaries." },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formFromPackage(plan: AdminPackage): FormState {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? "",
    priceMonthly: String(plan.priceMonthly),
    priceYearly: plan.priceYearly == null ? "" : String(plan.priceYearly),
    currency: plan.currency,
    trialDays: String(plan.trialDays),
    maxBusinesses: String(plan.maxBusinesses),
    maxUsers: String(plan.maxUsers),
    maxProducts: String(plan.maxProducts),
    maxSalesPerMonth: String(plan.maxSalesPerMonth),
    maxExpensesPerMonth: String(plan.maxExpensesPerMonth),
    allowReports: plan.allowReports,
    allowPdfExport: plan.allowPdfExport,
    allowCsvExport: plan.allowCsvExport,
    allowInventoryAlerts: plan.allowInventoryAlerts,
    allowAiInsights: plan.allowAiInsights,
    status: plan.status,
    sortOrder: String(plan.sortOrder),
  };
}

function numberValue(value: string) {
  return Number(value);
}

function validateForm(form: FormState) {
  const errors: FormErrors = {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (!slugPattern.test(form.slug.trim())) errors.slug = "Use lowercase letters, numbers, and single hyphens.";
  if (form.description.length > 500) errors.description = "Description cannot exceed 500 characters.";
  if (!/^[A-Z]{3}$/.test(form.currency.trim().toUpperCase())) errors.currency = "Use a 3-letter currency code.";

  const decimalFields: Array<keyof Pick<FormState, "priceMonthly" | "priceYearly">> = ["priceMonthly", "priceYearly"];
  decimalFields.forEach((key) => {
    if (key === "priceYearly" && form[key].trim() === "") return;
    const value = numberValue(form[key]);
    if (!Number.isFinite(value) || value < 0) errors[key] = "Enter a non-negative amount.";
  });

  [...limitFields.map((field) => field.key), "trialDays" as const, "sortOrder" as const].forEach((key) => {
    const value = numberValue(form[key]);
    if (!Number.isInteger(value) || value < 0) errors[key] = "Enter a non-negative whole number.";
  });

  return errors;
}

function toPayload(form: FormState): PackagePayload {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    priceMonthly: numberValue(form.priceMonthly),
    priceYearly: form.priceYearly.trim() === "" ? null : numberValue(form.priceYearly),
    currency: form.currency.trim().toUpperCase(),
    trialDays: numberValue(form.trialDays),
    maxBusinesses: numberValue(form.maxBusinesses),
    maxUsers: numberValue(form.maxUsers),
    maxProducts: numberValue(form.maxProducts),
    maxSalesPerMonth: numberValue(form.maxSalesPerMonth),
    maxExpensesPerMonth: numberValue(form.maxExpensesPerMonth),
    allowReports: form.allowReports,
    allowPdfExport: form.allowPdfExport,
    allowCsvExport: form.allowCsvExport,
    allowInventoryAlerts: form.allowInventoryAlerts,
    allowAiInsights: form.allowAiInsights,
    status: form.status,
    sortOrder: numberValue(form.sortOrder),
  };
}

export default function AdminPackageFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const title = isEdit ? "Edit package" : "Create package";
  const subtitle = isEdit ? "Update limits, pricing, and enabled features." : "Define pricing, limits, and feature access.";

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    setIsLoading(true);
    getAdminPackage(id)
      .then((plan) => {
        if (!isMounted) return;
        setForm(formFromPackage(plan));
        setSlugTouched(true);
      })
      .catch((error) => {
        if (!isMounted) return;
        setPageError(getApiErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      if (key === "currency") {
        next.currency = String(value).toUpperCase().slice(0, 3);
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setPageError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = toPayload(form);
      if (id) await updateAdminPackage(id, payload);
      else await createAdminPackage(payload);
      navigate("/admin/packages", {
        replace: true,
        state: { message: id ? "Package updated." : "Package created." },
      });
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/admin/packages"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-leaf"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Packages
          </Link>
          <h1 className="mt-2 font-display text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">{subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-ink/50">
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            Loading package...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {pageError && <PageMessage type="error" text={pageError} />}
          {hasErrors && <PageMessage type="error" text="Check the highlighted fields and try again." />}

          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus size={18} className="text-leaf" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-ink">Package details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" value={form.name} error={errors.name} onChange={(value) => updateField("name", value)} required />
              <TextField
                label="Slug"
                value={form.slug}
                error={errors.slug}
                onChange={(value) => {
                  setSlugTouched(true);
                  updateField("slug", slugify(value));
                }}
                required
              />
              <label className="sm:col-span-2 text-sm font-bold text-ink/65">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={3}
                  className={`mt-1 w-full rounded-lg border bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15 ${
                    errors.description ? "border-red-300" : "border-ink/15"
                  }`}
                />
                {errors.description && <FieldError text={errors.description} />}
              </label>
              <TextField
                label="Monthly price"
                type="number"
                value={form.priceMonthly}
                error={errors.priceMonthly}
                onChange={(value) => updateField("priceMonthly", value)}
                min="0"
                step="0.01"
                required
              />
              <TextField
                label="Yearly price"
                type="number"
                value={form.priceYearly}
                error={errors.priceYearly}
                onChange={(value) => updateField("priceYearly", value)}
                min="0"
                step="0.01"
              />
              <TextField
                label="Currency"
                value={form.currency}
                error={errors.currency}
                onChange={(value) => updateField("currency", value)}
                maxLength={3}
                required
              />
              <TextField
                label="Trial days"
                type="number"
                value={form.trialDays}
                error={errors.trialDays}
                onChange={(value) => updateField("trialDays", value)}
                min="0"
                required
              />
              <TextField
                label="Sort order"
                type="number"
                value={form.sortOrder}
                error={errors.sortOrder}
                onChange={(value) => updateField("sortOrder", value)}
                min="0"
                required
              />
              <label className="text-sm font-bold text-ink/65">
                Status
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as PackageStatus)}
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Limits</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {limitFields.map((field) => (
                <TextField
                  key={field.key}
                  label={field.label}
                  type="number"
                  value={form[field.key]}
                  error={errors[field.key]}
                  onChange={(value) => updateField(field.key, value)}
                  min="0"
                  required
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">Features</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {featureFields.map((field) => (
                <label key={field.key} className="flex gap-3 rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
                  <input
                    type="checkbox"
                    checked={form[field.key]}
                    onChange={(event) => updateField(field.key, event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-leaf"
                  />
                  <span>
                    <span className="block text-sm font-extrabold text-ink">{field.label}</span>
                    <span className="mt-0.5 block text-xs font-semibold leading-5 text-ink/45">{field.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/admin/packages"
              className="inline-flex items-center justify-center rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-extrabold text-ink/60 hover:bg-[#eef8f4]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
              {isEdit ? "Save package" : "Create package"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  error,
  onChange,
  type = "text",
  required = false,
  ...inputProps
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "required">) {
  return (
    <label className="text-sm font-bold text-ink/65">
      {label}
      <input
        {...inputProps}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-lg border bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15 ${
          error ? "border-red-300" : "border-ink/15"
        }`}
      />
      {error && <FieldError text={error} />}
    </label>
  );
}

function FieldError({ text }: { text: string }) {
  return <span className="mt-1 block text-xs font-bold text-red-600">{text}</span>;
}

function PageMessage({ type, text }: { type: "success" | "error"; text: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const classes = type === "success" ? "border-leaf/20 bg-mint text-leaf" : "border-red-200 bg-red-50 text-red-600";

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
