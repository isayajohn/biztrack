import { useCallback, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import AuthShowcasePanel from "../components/auth/AuthShowcasePanel";
import BrandLogo from "../components/BrandLogo";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { getApiErrorMessage } from "../services/apiClient";

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

function inputCls(hasError?: boolean) {
  return [
    "minimal-input w-full rounded-lg px-5 py-3.5 text-sm font-semibold text-ink outline-none",
    "transition-all placeholder:text-slateMuted/55 focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-200/50"
      : "focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, isLoading: isCheckingAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { message?: string } | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (isCheckingAuth) return <AuthLoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to={user?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  const routeAfterLogin = (loggedInUser: typeof user) => {
    if (loggedInUser?.role === "SUPER_ADMIN") return "/admin";
    return loggedInUser?.businessId ? "/dashboard" : "/onboarding";
  };

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
        navigate(routeAfterLogin(loggedInUser), { replace: true });
      } catch (err) {
        setErrors({ general: getApiErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, navigate],
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setErrors({});
      setIsGoogleLoading(true);
      try {
        const loggedInUser = await loginWithGoogle(credential);
        navigate(routeAfterLogin(loggedInUser), { replace: true });
      } catch (error) {
        setErrors({ general: getApiErrorMessage(error) });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [loginWithGoogle, navigate],
  );

  return (
    <main className="spatial-shell min-h-screen text-ink lg:grid lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="bento-card w-full max-w-md rounded-xl p-5 sm:p-7">
          <div className="mb-12 sm:mb-14">
            <BrandLogo className="h-auto w-44 max-w-full" />
          </div>

          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-leaf/15 bg-white/70 px-3 py-1 text-xs font-black text-leaf shadow-sm">
              <Sparkles size={14} aria-hidden="true" />
              Welcome back
            </p>
            <h1 className="font-display text-3xl font-black tracking-normal text-ink">
              Log in to your account
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slateMuted">
              Track sales, expenses, stock, and profit from one simple workspace.
            </p>
          </div>

          {locationState?.message && (
            <div className="mt-6 rounded-lg border border-leaf/20 bg-mint px-4 py-3 text-sm font-semibold text-leaf">
              {locationState.message}
            </div>
          )}

          {errors.general && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.general}
            </div>
          )}

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-ink">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={inputCls(Boolean(errors.email)) + " pr-12"}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <Mail
                  size={17}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slateMuted/60"
                  aria-hidden="true"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs font-semibold text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={inputCls(Boolean(errors.password)) + " pr-12"}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "pw-error" : undefined}
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
              {errors.password && (
                <p id="pw-error" className="mt-1.5 text-xs font-semibold text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slateMuted">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink/20 text-leaf focus:ring-leaf"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-black text-leaf hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf py-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(11,146,121,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0b5f59] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3 text-sm font-bold text-slateMuted/70">
            <span className="h-px flex-1 bg-ink/10" />
            Or
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <GoogleAuthButton
            disabled={isGoogleLoading || isLoading}
            onCredential={handleGoogleCredential}
            onError={(message) => setErrors({ general: message })}
          />

          <p className="mt-8 text-center text-sm font-semibold text-slateMuted">
            Don't have an account?{" "}
            <Link to="/register" className="font-black text-leaf hover:underline">
              Sign up
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
        title="Very simple way to manage business"
        text="Welcome to BizTrack. Record daily sales, control expenses, manage products, and understand your profit with less effort."
      />
    </main>
  );
}
