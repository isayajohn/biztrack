import { useState, useCallback } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import BrandLogo from "../components/BrandLogo";
import { getApiErrorMessage } from "../services/apiClient";

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};

function validate(email: string, password: string): FormErrors {
  const errs: FormErrors = {};
  if (!email.trim()) errs.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
  if (!password) errs.password = "Password is required.";
  else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
  return errs;
}

// ─── Shared input class helpers ───────────────────────────────────────────────

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

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: isCheckingAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { message?: string } | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  if (isCheckingAuth) return <AuthLoadingScreen />;

  // Already signed in → go straight to dashboard
  if (isAuthenticated) {
    return <Navigate to={user?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate(email, password);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setIsLoading(true);
      try {
        const loggedInUser = await login(email, password);
        navigate(loggedInUser.role === "SUPER_ADMIN" ? "/admin" : "/dashboard", { replace: true });
      } catch (err) {
        setErrors({ general: getApiErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, navigate],
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfaf6] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo className="h-auto w-56 max-w-full" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink/55">Sign in to your BizTrack account</p>

          {locationState?.message && (
            <div className="mt-5 rounded-xl border border-leaf/20 bg-mint px-4 py-3 text-sm font-semibold text-leaf">
              {locationState.message}
            </div>
          )}

          {/* General error */}
          {errors.general && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.general}
            </div>
          )}

          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                className={inputCls(!!errors.email)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs font-medium text-red-500">
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={inputCls(!!errors.password) + " pr-11"}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "pw-error" : undefined}
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
                <p id="pw-error" className="mt-1 text-xs font-medium text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-leaf hover:underline">
              Get started free
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
