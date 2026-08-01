import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type RegisterData } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import { useNoIndex } from "../hooks/useSeo";
import { getApiErrorMessage, getRateLimitSeconds } from "../services/apiClient";
import { getPublicPackages, type PublicPackage } from "../services/landingApi";
import { formatCurrency } from "../utils/format";
import {
  closeLoadingAlert,
  notify,
  showLoadingAlert,
  type AppNotificationVariant,
} from "../lib/notifications";

const CURRENCIES = [
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", name: "South African Rand" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<
  Record<
    | "name"
    | "email"
    | "password"
    | "confirmPassword"
    | "businessName"
    | "currency"
    | "terms"
    | "general",
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

function packagePrice(plan: PublicPackage) {
  return plan.priceMonthly === 0 ? "Free" : `${formatCurrency(plan.priceMonthly, plan.currency)}/mo`;
}

function packageSummary(plan: PublicPackage) {
  const pieces = [
    `Up to ${plan.limits.maxProducts} products`,
    `${plan.limits.maxSalesPerMonth} sales/month`,
  ];
  pieces.push("7-day all-features trial");
  return pieces.join(" / ");
}

function validate(f: Fields, acceptedTerms: boolean): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = "Name is required.";
  else if (f.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
  if (!f.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(f.email)) e.email = "Enter a valid email address.";
  if (!f.password) e.password = "Password is required.";
  else if (f.password.length < 8) e.password = "Password must be at least 8 characters.";
  if (!f.confirmPassword) e.confirmPassword = "Please confirm your password.";
  else if (f.confirmPassword !== f.password) e.confirmPassword = "Passwords do not match.";
  if (!f.businessName.trim()) e.businessName = "Business name is required.";
  else if (f.businessName.trim().length < 2)
    e.businessName = "Business name must be at least 2 characters.";
  if (!f.currency) e.currency = "Please select a currency.";
  if (!acceptedTerms) e.terms = "Accept the terms to continue.";
  return e;
}

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-3.5 text-sm font-semibold text-white outline-none",
    "bg-white/[0.075] transition-all placeholder:text-white/30 focus:ring-4",
    hasError
      ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/10"
      : "border-white/[0.12] focus:border-[#12e4d7]/60 focus:ring-[#12e4d7]/10",
  ].join(" ");
}

export default function RegisterPage() {
  useNoIndex();
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
    currency: "TZS",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState("");

  const selectedPackage = useMemo(
    () => packages.find((plan) => plan.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const closeLoadingNotification = useCallback(() => {
    closeLoadingAlert();
  }, []);

  const showLoadingNotification = useCallback(
    (message: string) => {
      closeLoadingNotification();
      showLoadingAlert(message);
    },
    [closeLoadingNotification],
  );

  const showNotification = useCallback(
    (message: string, variant: AppNotificationVariant) => {
      closeLoadingNotification();
      notify(message, variant);
    },
    [closeLoadingNotification],
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPackages(true);

    getPublicPackages()
      .then((plans) => {
        if (isMounted) {
          setPackages(plans.filter((plan) => plan.slug.toLowerCase() === "free" || plan.priceMonthly === 0));
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        const rateLimitSeconds = getRateLimitSeconds(error);
        if (rateLimitSeconds) {
          const seconds = Math.max(1, Math.min(rateLimitSeconds, 60));
          setRetrySeconds(seconds);
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
      const errs = validate(fields, acceptedTerms);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      showLoadingNotification("Creating your account...");
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
          showNotification(message, result.verificationEmailSent ? "success" : "error");
          navigate("/login", {
            replace: true,
            state: { message },
          });
          return;
        }
        showNotification("Account created. Opening your dashboard...", "success");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        const rateLimitSeconds = getRateLimitSeconds(error);
        if (rateLimitSeconds) {
          const seconds = Math.max(1, Math.min(rateLimitSeconds, 60));
          setRetrySeconds(seconds);
          const message = `Too many attempts. Please wait ${seconds} seconds. This page will refresh automatically.`;
          setErrors({ general: message });
          return;
        }

        const message = getApiErrorMessage(error);
        setErrors({ general: message });
        showNotification(message, "error");
      } finally {
        closeLoadingNotification();
        setIsLoading(false);
      }
    },
    [
      acceptedTerms,
      closeLoadingNotification,
      fields,
      navigate,
      register,
      selectedPackageId,
      showLoadingNotification,
      showNotification,
    ],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07102b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[url('/auth-bg.jpg')] bg-cover bg-center" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(3,8,26,.96)_5%,rgba(5,14,42,.79)_50%,rgba(3,8,26,.95)_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(18,228,215,.12),transparent_36%)]" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" aria-label="BizTrack home">
          <img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="h-auto w-36 sm:w-40" />
        </Link>
        <p className="hidden text-sm text-white/45 sm:block">
          Already a member?{" "}
          <Link to="/login" className="font-bold text-[#12e4d7] hover:text-white">Log in</Link>
        </p>
      </header>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-28 sm:px-8">
        <div className="w-full max-w-xl rounded-[28px] border border-white/[0.13] bg-[#071032]/80 p-6 shadow-[0_35px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-9">
          <div className="mb-7 h-px w-full bg-gradient-to-r from-transparent via-amber-400/75 to-transparent" />
          <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
            Start for free
          </span>
          <h1 className="mt-4 font-display text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
            Create your account.
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/45">
            Set up your business workspace and see every important number in one place.
          </p>

          {errors.general && (
            <div className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
              {errors.general}
            </div>
          )}

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit} noValidate>
            <Field id="name" label="Name" error={errors.name}>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Enter your name"
                value={fields.name}
                onChange={set("name")}
                className={inputCls(Boolean(errors.name))}
              />
            </Field>

            <Field id="email" label="Email" error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={fields.email}
                onChange={set("email")}
                className={inputCls(Boolean(errors.email))}
              />
            </Field>

            <Field id="password" label="Password" error={errors.password}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={fields.password}
                  onChange={set("password")}
                  className={inputCls(Boolean(errors.password)) + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-[#12e4d7]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={fields.confirmPassword}
                  onChange={set("confirmPassword")}
                  className={inputCls(Boolean(errors.confirmPassword)) + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-[#12e4d7]"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="businessName" label="Business" error={errors.businessName}>
                <input
                  id="businessName"
                  type="text"
                  placeholder="Business name"
                  value={fields.businessName}
                  onChange={set("businessName")}
                  className={inputCls(Boolean(errors.businessName))}
                />
              </Field>

              <Field id="currency" label="Currency" error={errors.currency}>
                <div className="relative">
                  <select
                    id="currency"
                    value={fields.currency}
                    onChange={set("currency")}
                    className={inputCls(Boolean(errors.currency)) + " appearance-none pr-10"}
                  >
                    {CURRENCIES.map(({ code, name }) => (
                      <option key={code} value={code}>
                        {code} - {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35"
                    aria-hidden="true"
                  />
                </div>
              </Field>
            </div>

            <div>
              <label htmlFor="packageId" className="mb-2 block text-sm font-bold text-white/75">
                Package
              </label>
              {isLoadingPackages ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold text-white/45">
                  Loading packages...
                </div>
              ) : packages.length > 0 ? (
                <>
                  <div className="relative">
                    <select
                      id="packageId"
                      value={selectedPackageId}
                      onChange={(event) => setSelectedPackageId(event.target.value)}
                      className={inputCls(false) + " appearance-none pr-10"}
                    >
                      {packages.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - {packagePrice(plan)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35"
                      aria-hidden="true"
                    />
                  </div>
                  {selectedPackage && (
                    <p className="mt-2 text-xs font-semibold leading-5 text-white/40">
                      <span className="font-black text-white/75">{selectedPackage.name}</span>{" "}
                      includes {packageSummary(selectedPackage)}.
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold text-white/45">
                  Free package will be assigned automatically.
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm font-semibold text-white/45">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    setAcceptedTerms(event.target.checked);
                    if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-[#12e4d7] focus:ring-[#12e4d7]"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="font-black text-[#12e4d7] underline">
                    Terms & Conditions
                  </a>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.terms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || retrySeconds > 0}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#12e4d7] py-4 text-sm font-black text-[#051210] shadow-[0_12px_35px_rgba(18,228,215,.16)] transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-65"
            >
              {retrySeconds > 0 ? (
                `Try again in ${retrySeconds}s`
              ) : isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-semibold text-white/45 sm:hidden">
            Already have an account?{" "}
            <Link to="/login" className="font-black text-[#12e4d7] hover:underline">
              Log in
            </Link>
          </p>

          <Link
            to="/"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-white/35 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-white/75">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
