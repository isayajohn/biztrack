import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Loader2,
  ReceiptText,
  Store,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import BrandLogo from "../components/BrandLogo";
import { getApiErrorMessage } from "../services/apiClient";
import { updateBusinessProfile } from "../services/authApi";

const CURRENCIES = [
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", name: "South African Rand" },
];

const COUNTRIES = ["Tanzania", "Kenya", "Uganda", "Nigeria", "Ghana", "South Africa"];

const steps = [
  {
    icon: Store,
    title: "Add business profile",
    text: "Set the business name, owner contact, country, and currency.",
  },
  {
    icon: Boxes,
    title: "Add products",
    text: "Create your stock list and low-stock levels before recording sales.",
  },
  {
    icon: ReceiptText,
    title: "Record daily activity",
    text: "Enter sales and expenses as they happen so reports stay accurate.",
  },
  {
    icon: BarChart3,
    title: "Read reports",
    text: "Check profit, product movement, and expense patterns at the end of the day.",
  },
];

type Fields = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
};

type Errors = Partial<Record<keyof Fields | "general", string>>;

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#fbfaf6] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.businessName.trim()) errors.businessName = "Business name is required.";
  if (!fields.ownerName.trim()) errors.ownerName = "Owner name is required.";
  if (!fields.phone.trim()) errors.phone = "Phone number is required.";
  if (!fields.country) errors.country = "Country is required.";
  if (!fields.currency) errors.currency = "Currency is required.";
  return errors;
}

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState<Fields>(() => ({
    businessName: "",
    ownerName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    country: user?.country ?? "Tanzania",
    currency: user?.currency === "USD" ? "TZS" : user?.currency ?? "TZS",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);

  const progress = useMemo(() => {
    const filled = [
      fields.businessName,
      fields.ownerName,
      fields.email,
      fields.phone,
      fields.country,
      fields.currency,
    ].filter((value) => value.trim()).length;
    return Math.round((filled / 6) * 100);
  }, [fields]);

  const setField =
    <K extends keyof Fields>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
      if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(fields);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      const business = await updateBusinessProfile({
        name: fields.businessName.trim(),
        ownerName: fields.ownerName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        country: fields.country,
        currency: fields.currency,
      });
      updateUser({
        name: fields.ownerName.trim(),
        email: fields.email.trim(),
        businessName: business.name,
        businessId: business.id,
        country: business.country,
        currency: business.currency,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrors({ general: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf6] px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto flex max-w-6xl justify-center py-3">
        <BrandLogo className="h-auto w-52 max-w-full" />
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-leaf">
                Account setup
              </p>
              <h1 className="mt-2 font-display text-2xl font-black text-ink">
                Finish your business profile
              </h1>
              <p className="mt-2 text-sm font-medium leading-6 text-ink/60">
                Your Google email is verified. Add the business details that BizTrack will use
                for sales, stock, expenses, and reports.
              </p>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-mint text-leaf">
              <WalletCards size={24} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-ink/55">
              <span>Profile progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-leaf" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {errors.general && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.general}
            </div>
          )}

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <Field label="Business name" error={errors.businessName}>
              <input
                value={fields.businessName}
                onChange={setField("businessName")}
                className={inputCls(Boolean(errors.businessName))}
                placeholder="e.g. John's Electronics"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner name" error={errors.ownerName}>
                <input
                  value={fields.ownerName}
                  onChange={setField("ownerName")}
                  className={inputCls(Boolean(errors.ownerName))}
                  placeholder="Owner or manager name"
                />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <input
                  value={fields.phone}
                  onChange={setField("phone")}
                  className={inputCls(Boolean(errors.phone))}
                  placeholder="+255..."
                />
              </Field>
            </div>

            <Field label="Google email">
              <input
                value={fields.email}
                onChange={setField("email")}
                className={inputCls(false)}
                type="email"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Country" error={errors.country}>
                <select
                  value={fields.country}
                  onChange={setField("country")}
                  className={inputCls(Boolean(errors.country)) + " appearance-none pr-10"}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </SelectField>
              <SelectField label="Currency" error={errors.currency}>
                <select
                  value={fields.currency}
                  onChange={setField("currency")}
                  className={inputCls(Boolean(errors.currency)) + " appearance-none pr-10"}
                >
                  {CURRENCIES.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
              </SelectField>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Saving profile...
                </>
              ) : (
                <>
                  Continue to dashboard
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </section>

        <aside className="grid gap-4">
          <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-ink">First day guide</h2>
            <div className="mt-4 grid gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-3 rounded-xl bg-[#fbfaf6] p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-mint text-leaf">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-ink">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">
                        {step.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-leaf/15 bg-mint p-5">
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-black text-leaf">Tip for clean reports</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-leaf/75">
                  Start with products before sales. That lets BizTrack connect each sale to
                  stock and profit automatically.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </label>
  );
}

function SelectField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        {children}
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}
