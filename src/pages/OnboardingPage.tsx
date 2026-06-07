import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Globe2,
  Loader2,
  Mail,
  Phone,
  ReceiptText,
  Store,
  User,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
    "w-full rounded-lg border px-4 py-3 text-sm font-semibold text-ink outline-none transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/10 bg-white focus:border-leaf focus:ring-leaf/15",
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
    <div className="mx-auto max-w-7xl px-4 py-5 text-ink sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
            <div className="bg-leaf px-5 py-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-white/70">
                Setup required
              </p>
              <h1 className="mt-2 font-display text-2xl font-black tracking-normal">
                Finish your business profile
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
                Add the details BizTrack uses for sales, stock, expenses, receipts, and reports.
              </p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs font-black text-ink/55">
                <span>Profile completion</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-leaf" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-5 rounded-lg border border-ink/10 bg-[#fbfaf6] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mint text-leaf">
                    <Store size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-ink">
                      {fields.businessName.trim() || "Your business name"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink/50">
                      {fields.country} · {fields.currency}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <PreviewMetric icon={ReceiptText} label="Sales" value="0" />
                  <PreviewMetric icon={Boxes} label="Products" value="0" />
                  <PreviewMetric icon={WalletCards} label="Expenses" value="0" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink">First day guide</h2>
            <div className="mt-4 grid gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fbfaf6] text-leaf">
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
        </aside>

        <main className="rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="border-b border-ink/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-leaf">Business setup</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink">Profile details</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/45">
                Keep this information accurate; it appears across reports and account records.
              </p>
            </div>
          </div>

          {errors.general && (
            <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 sm:mx-6">
              {errors.general}
            </div>
          )}

          <form className="grid gap-6 p-5 sm:p-6" onSubmit={handleSubmit}>
            <section>
              <SectionTitle icon={Store} title="Business identity" />
              <div className="mt-3 grid gap-4">
                <Field label="Business name" error={errors.businessName}>
                  <input
                    value={fields.businessName}
                    onChange={setField("businessName")}
                    className={inputCls(Boolean(errors.businessName))}
                    placeholder="e.g. John's Electronics"
                  />
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle icon={User} title="Owner contact" />
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Owner name" error={errors.ownerName}>
                  <input
                    value={fields.ownerName}
                    onChange={setField("ownerName")}
                    className={inputCls(Boolean(errors.ownerName))}
                    placeholder="Owner or manager name"
                  />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30"
                      aria-hidden="true"
                    />
                    <input
                      value={fields.phone}
                      onChange={setField("phone")}
                      className={inputCls(Boolean(errors.phone)) + " pl-10"}
                      placeholder="+255..."
                    />
                  </div>
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Google email">
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30"
                      aria-hidden="true"
                    />
                    <input
                      value={fields.email}
                      onChange={setField("email")}
                      className={inputCls(false) + " pl-10"}
                      type="email"
                    />
                  </div>
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle icon={Globe2} title="Location and money" />
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
            </section>

            <div className="rounded-lg border border-leaf/15 bg-mint px-4 py-3">
              <div className="flex gap-3">
                <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-leaf/80">
                  After setup, start with products before recording sales so stock and profit reports stay accurate.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold leading-5 text-ink/45">
                You can edit these settings later from the Settings page.
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-65"
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
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function PreviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white px-2 py-3">
      <Icon size={16} className="mx-auto text-leaf" aria-hidden="true" />
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.04em] text-ink/35">{label}</p>
      <p className="text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-leaf">
        <Icon size={16} aria-hidden="true" />
      </span>
      <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
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
    <label className="block text-sm font-bold text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
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
