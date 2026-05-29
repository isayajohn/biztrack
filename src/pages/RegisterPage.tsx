import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type RegisterData } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import BrandLogo from "../components/BrandLogo";
import { getApiErrorMessage, getRateLimitSeconds } from "../services/apiClient";
import { getPublicPackages } from "../services/landingApi";
import type { PublicPackage } from "../services/landingApi";
import { formatCurrency } from "../utils/format";

// ─── Currency list ────────────────────────────────────────────────────────────

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
];

const PERKS = [
  "Free forever on the basic plan",
  "No credit card required",
  "Set up in under 5 minutes",
];

function packagePrice(plan: PublicPackage) {
  return plan.priceMonthly === 0 ? "Free" : `${formatCurrency(plan.priceMonthly, plan.currency)}/mo`;
}

function packageSummary(plan: PublicPackage) {
  const pieces = [
    `Up to ${plan.limits.maxProducts} products`,
    `${plan.limits.maxSalesPerMonth} sales/month`,
  ];
  if (plan.trialDays > 0) pieces.push(`${plan.trialDays}-day trial`);
  return pieces.join(" / ");
}

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<
  Record<
    "name" | "email" | "password" | "confirmPassword" | "businessName" | "currency" | "general",
    string
  >
>;

type Fields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  currency: string;
};

function validate(f: Fields): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = "Full name is required.";
  else if (f.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
  if (!f.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(f.email)) e.email = "Enter a valid email address.";
  if (!f.password) e.password = "Password is required.";
  else if (f.password.length < 6) e.password = "Password must be at least 6 characters.";
  if (!f.confirmPassword) e.confirmPassword = "Please confirm your password.";
  else if (f.confirmPassword !== f.password) e.confirmPassword = "Passwords do not match.";
  if (!f.businessName.trim()) e.businessName = "Business name is required.";
  else if (f.businessName.trim().length < 2)
    e.businessName = "Business name must be at least 2 characters.";
  if (!f.currency) e.currency = "Please select a currency.";
  return e;
}

// ─── Shared input class helper ────────────────────────────────────────────────

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none",
    "transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#fbfaf6] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: isCheckingAuth, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageSlug = searchParams.get("package")?.trim().toLowerCase() ?? "";

  const [fields, setFields] = useState<Fields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    currency: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState<{
    type: "loading" | "success" | "error";
    message: string;
  } | null>(null);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState("");

  const selectedPackage = useMemo(
    () => packages.find((plan) => plan.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPackages(true);

    getPublicPackages()
      .then((plans) => {
        if (isMounted) setPackages(plans);
      })
      .catch((error) => {
        if (!isMounted) return;
        const rateLimitSeconds = getRateLimitSeconds(error);
        if (rateLimitSeconds) {
          const seconds = Math.max(1, Math.min(rateLimitSeconds, 60));
          setRetrySeconds(seconds);
          setNotification({
            type: "error",
            message: `Too many requests. Please wait ${seconds} seconds. This page will refresh automatically.`,
          });
        }
        setPackages([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPackages(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (packages.length === 0) return;

    setSelectedPackageId((current) => {
      const requestedPackage = packageSlug
        ? packages.find((plan) => plan.slug.toLowerCase() === packageSlug)
        : null;
      if (requestedPackage) return requestedPackage.id;
      if (current && packages.some((plan) => plan.id === current)) return current;
      const freePackage = packages.find((plan) => plan.slug === "free" || plan.priceMonthly === 0);
      return freePackage?.id ?? packages[0].id;
    });
  }, [packageSlug, packages]);

  useEffect(() => {
    if (retrySeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRetrySeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          window.location.reload();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retrySeconds]);

  if (isCheckingAuth) return <AuthLoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={user?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  const set =
    <K extends keyof Fields>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
    };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate(fields);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setNotification({ type: "loading", message: "Creating your account..." });
      setIsLoading(true);
      try {
        const data: RegisterData = {
          name: fields.name.trim(),
          email: fields.email.trim(),
          password: fields.password,
          businessName: fields.businessName.trim(),
          currency: fields.currency,
          packageId: selectedPackageId || undefined,
        };
        const result = await register(data);
        if (result.requiresEmailVerification) {
          const message = result.verificationEmailSent
            ? "Account created. Check your email to verify your account before signing in."
            : "Account created, but the verification email could not be sent. Ask an admin to resend it.";
          setNotification({
            type: result.verificationEmailSent ? "success" : "error",
            message,
          });
          navigate("/login", {
            replace: true,
            state: {
              message,
            },
          });
          return;
        }
        setNotification({ type: "success", message: "Account created. Opening your dashboard..." });
        navigate("/dashboard", { replace: true });
      } catch (error) {
        const rateLimitSeconds = getRateLimitSeconds(error);
        if (rateLimitSeconds) {
          const seconds = Math.max(1, Math.min(rateLimitSeconds, 60));
          setRetrySeconds(seconds);
          const message = `Too many attempts. Please wait ${seconds} seconds. This page will refresh automatically.`;
          setErrors({ general: message });
          setNotification({ type: "error", message });
          return;
        }

        const message = getApiErrorMessage(error);
        setErrors({ general: message });
        setNotification({ type: "error", message });
      } finally {
        setIsLoading(false);
      }
    },
    [fields, navigate, register, selectedPackageId],
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfaf6] px-4 py-12">
      {notification && (
        <div
          role="status"
          className={[
            "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold shadow-soft",
            notification.type === "success"
              ? "border-leaf/20 text-leaf"
              : notification.type === "error"
                ? "border-red-200 text-red-600"
                : "border-ink/10 text-ink/65",
          ].join(" ")}
        >
          {notification.type === "loading" ? (
            <Loader2 size={16} className="mt-0.5 animate-spin" aria-hidden="true" />
          ) : notification.type === "error" ? (
            <AlertCircle size={16} className="mt-0.5" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5" aria-hidden="true" />
          )}
          <span>{notification.message}</span>
          {retrySeconds > 0 && (
            <span className="ml-1 rounded-full bg-ink/8 px-2 py-0.5 text-xs font-black">
              {retrySeconds}s
            </span>
          )}
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo className="h-auto w-56 max-w-full" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-1.5 text-sm text-ink/55">Start tracking your business for free</p>

          {/* Perks */}
          <div className="mt-4 flex flex-col gap-1.5">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-leaf" aria-hidden="true" />
                <span className="text-xs font-semibold text-ink/55">{perk}</span>
              </div>
            ))}
          </div>

          {/* General error */}
          {errors.general && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.general}
            </div>
          )}

          <div className="mt-5">
            <label htmlFor="packageId" className="mb-1.5 block text-sm font-semibold text-ink">
              Package
            </label>
            {isLoadingPackages ? (
              <div className="rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-semibold text-ink/45">
                Loading packages...
              </div>
            ) : packages.length > 0 ? (
              <>
                <div className="relative">
                  <select
                    id="packageId"
                    value={selectedPackageId}
                    onChange={(event) => setSelectedPackageId(event.target.value)}
                    className={inputCls(false) + " cursor-pointer appearance-none pr-10"}
                  >
                    {packages.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {packagePrice(plan)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40"
                    aria-hidden="true"
                  />
                </div>
                {selectedPackage && (
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink/50">
                    <span className="font-extrabold text-ink">{selectedPackage.name}</span>{" "}
                    includes {packageSummary(selectedPackage)}.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-semibold text-ink/50">
                Free package will be assigned automatically.
              </p>
            )}
          </div>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
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

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={fields.email}
                onChange={set("email")}
                className={inputCls(!!errors.email)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-err" : undefined}
              />
              {errors.email && (
                <p id="email-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={fields.password}
                  onChange={set("password")}
                  className={inputCls(!!errors.password) + " pr-11"}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "pw-err" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 transition-colors hover:text-ink/60"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="pw-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={fields.confirmPassword}
                  onChange={set("confirmPassword")}
                  className={inputCls(!!errors.confirmPassword) + " pr-11"}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "cpw-err" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 transition-colors hover:text-ink/60"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="cpw-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Business name */}
            <div>
              <label
                htmlFor="businessName"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                placeholder="e.g. Jane's Store"
                value={fields.businessName}
                onChange={set("businessName")}
                className={inputCls(!!errors.businessName)}
                aria-invalid={!!errors.businessName}
                aria-describedby={errors.businessName ? "biz-err" : undefined}
              />
              {errors.businessName && (
                <p id="biz-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.businessName}
                </p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="mb-1.5 block text-sm font-semibold text-ink">
                Currency
              </label>
              <div className="relative">
                <select
                  id="currency"
                  value={fields.currency}
                  onChange={set("currency")}
                  className={
                    inputCls(!!errors.currency) +
                    " cursor-pointer appearance-none pr-10"
                  }
                  aria-invalid={!!errors.currency}
                  aria-describedby={errors.currency ? "cur-err" : undefined}
                >
                  <option value="" disabled>
                    Select your currency…
                  </option>
                  {CURRENCIES.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {code} – {name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40"
                  aria-hidden="true"
                />
              </div>
              {errors.currency && (
                <p id="cur-err" className="mt-1 text-xs font-medium text-red-500">
                  {errors.currency}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || retrySeconds > 0}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {retrySeconds > 0 ? (
                `Try again in ${retrySeconds}s`
              ) : isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                selectedPackage?.priceMonthly === 0 ? "Create Free Account" : "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-leaf hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back */}
        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
