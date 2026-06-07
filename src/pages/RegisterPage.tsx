import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type RegisterData } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import AuthShowcasePanel from "../components/auth/AuthShowcasePanel";
import BrandLogo from "../components/BrandLogo";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { getApiErrorMessage, getRateLimitSeconds } from "../services/apiClient";
import { getPublicPackages, type PublicPackage } from "../services/landingApi";
import { formatCurrency } from "../utils/format";

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
  else if (f.password.length < 6) e.password = "Password must be at least 6 characters.";
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
    "w-full rounded-lg border px-5 py-3.5 text-sm font-semibold text-ink outline-none",
    "bg-[#f5f9f8] transition-all placeholder:text-slateMuted/55 focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-200/50"
      : "border-transparent focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

export default function RegisterPage() {
  const { register, loginWithGoogle, isAuthenticated, isLoading: isCheckingAuth, user } = useAuth();
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
  const [notification, setNotification] = useState<{
    type: "loading" | "success" | "error";
    message: string;
  } | null>(null);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const routeAfterLogin = (loggedInUser: typeof user) => {
    if (loggedInUser?.role === "SUPER_ADMIN") return "/admin";
    return loggedInUser?.businessId ? "/dashboard" : "/onboarding";
  };

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
            state: { message },
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
    [acceptedTerms, fields, navigate, register, selectedPackageId],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setErrors({});
      setNotification({ type: "loading", message: "Connecting your Google account..." });
      setIsGoogleLoading(true);
      try {
        const loggedInUser = await loginWithGoogle(credential);
        setNotification({ type: "success", message: "Google account connected." });
        navigate(routeAfterLogin(loggedInUser), { replace: true });
      } catch (error) {
        const message = getApiErrorMessage(error);
        setErrors({ general: message });
        setNotification({ type: "error", message });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [loginWithGoogle, navigate],
  );

  return (
    <main className="min-h-screen bg-white text-ink lg:grid lg:grid-cols-2">
      {notification && (
        <div
          role="status"
          className={[
            "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border bg-white px-4 py-3 text-sm font-semibold shadow-soft",
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

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <BrandLogo className="h-auto w-44 max-w-full" />
          </div>

          <h1 className="font-display text-3xl font-black tracking-normal text-ink">
            Create an account
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slateMuted">
            Sign up with Google, or create your account with business details now.
          </p>

          {errors.general && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slateMuted/60 transition-colors hover:text-leaf"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slateMuted/60 transition-colors hover:text-leaf"
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
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slateMuted/55"
                    aria-hidden="true"
                  />
                </div>
              </Field>
            </div>

            <div>
              <label htmlFor="packageId" className="mb-2 block text-sm font-bold text-ink">
                Package
              </label>
              {isLoadingPackages ? (
                <div className="rounded-lg bg-[#f5f9f8] px-5 py-3.5 text-sm font-semibold text-slateMuted">
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
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slateMuted/55"
                      aria-hidden="true"
                    />
                  </div>
                  {selectedPackage && (
                    <p className="mt-2 text-xs font-semibold leading-5 text-slateMuted">
                      <span className="font-black text-ink">{selectedPackage.name}</span>{" "}
                      includes {packageSummary(selectedPackage)}.
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-lg bg-[#f5f9f8] px-5 py-3.5 text-sm font-semibold text-slateMuted">
                  Free package will be assigned automatically.
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm font-semibold text-slateMuted">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    setAcceptedTerms(event.target.checked);
                    if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-ink/20 text-leaf focus:ring-leaf"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="font-black text-leaf underline">
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
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf py-4 text-sm font-black text-white shadow-sm transition-all hover:bg-[#0b5f59] disabled:cursor-not-allowed disabled:opacity-65"
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

          <div className="my-7 flex items-center gap-3 text-sm font-bold text-slateMuted/70">
            <span className="h-px flex-1 bg-ink/10" />
            Or
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <GoogleAuthButton
            disabled={isGoogleLoading || isLoading || retrySeconds > 0}
            onCredential={handleGoogleCredential}
            onError={(message) => {
              setErrors({ general: message });
              setNotification({ type: "error", message });
            }}
          />

          <p className="mt-8 text-center text-sm font-semibold text-slateMuted">
            Already have an account?{" "}
            <Link to="/login" className="font-black text-leaf hover:underline">
              Log in
            </Link>
          </p>

          <Link
            to="/"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-slateMuted transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </section>

      <AuthShowcasePanel
        title="Very simple way you can engage"
        text="Welcome to BizTrack. Efficiently track sales, inventory, expenses, and profit with a guided account setup."
      />
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
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
