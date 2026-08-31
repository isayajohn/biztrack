import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import { useNoIndex } from "../hooks/useSeo";
import { getApiErrorMessage } from "../services/apiClient";
import { notifyError, notifySuccess } from "../lib/notifications";

type FormErrors = { email?: string; password?: string; general?: string };

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) errors.email = "Email address or phone number is required.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  return errors;
}

function inputClass(hasError?: boolean) {
  return `h-12 w-full rounded-xl border bg-white/[0.075] px-11 pr-12 text-sm font-semibold text-white outline-none transition-all placeholder:text-white/35 focus:ring-4 ${hasError ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/10" : "border-white/15 focus:border-emerald-400/60 focus:ring-emerald-400/10"}`;
}

export default function LoginPage() {
  useNoIndex();
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
  if (isAuthenticated) return <Navigate to={user?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"} replace />;

  const routeAfterLogin = (loggedInUser: typeof user) => loggedInUser?.role === "SUPER_ADMIN" ? "/admin" : loggedInUser?.businessId ? "/dashboard" : "/onboarding";

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(email, password);
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setErrors({});
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      notifySuccess(`Welcome back, ${loggedInUser.name}.`);
      navigate(routeAfterLogin(loggedInUser), { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error);
      setErrors({ general: message });
      notifyError(message);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, navigate]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#07102b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/auth-bg.jpg')" }} />
      <div className="pointer-events-none absolute inset-0 bg-[#07102b]/45" />

      <header className="relative z-10 flex items-center justify-between px-5 pb-4 pt-7 sm:px-8 sm:pt-9">
        <Link to="/" aria-label="BizTrack home"><img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="h-auto w-40" /></Link>
        <Link to="/about" className="hidden text-sm font-semibold text-white/60 hover:text-white sm:block">About BizTrack</Link>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 pt-4">
        <div className="group relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber-100/20 bg-[#071032]/75 p-7 shadow-[0_40px_100px_-30px_rgba(3,7,30,0.88),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
          <div className="relative">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-100"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" /> Sign in to BizTrack</span>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-[15px] text-white/60">Sign in to keep your business one tap away.</p>

            {locationState?.message && <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{locationState.message}</div>}
            {errors.general && <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">{errors.general}</div>}

            <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-white/90">Email or phone number</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
                  <input id="email" type="text" autoComplete="username" placeholder="Email address or 07XXXXXXXX" value={email} onChange={(event) => { setEmail(event.target.value); if (errors.email) setErrors((current) => ({ ...current, email: undefined })); }} className={inputClass(Boolean(errors.email))} aria-invalid={Boolean(errors.email)} />
                </div>
                {errors.email && <p className="mt-1.5 text-xs font-semibold text-red-300">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-white/90">Password</label>
                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); if (errors.password) setErrors((current) => ({ ...current, password: undefined })); }} className={inputClass(Boolean(errors.password))} aria-invalid={Boolean(errors.password)} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-semibold text-red-300">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-white/65"><input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-400 focus:ring-emerald-400" /> Remember me</label>
                <Link to="/forgot-password" className="font-semibold text-white/80 hover:text-white hover:underline">Forgot password?</Link>
              </div>

              <button type="submit" disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-bold text-[#031b12] shadow-[0_15px_40px_-12px_rgba(16,185,129,0.7)] hover:bg-emerald-300 disabled:opacity-60">
                {isLoading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={17} /></>}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-white/65">Don&apos;t have an account? <Link to="/register" className="font-semibold text-emerald-300 hover:text-emerald-200 hover:underline">Sign up</Link></p>
            <Link to="/" className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-white/45 hover:text-white"><ArrowLeft size={14} /> Back to home</Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 pb-6 text-center text-xs text-white/45"><span className="inline-flex items-center gap-2"><Sparkles size={13} /> Secure business management for growing teams</span></footer>
    </main>
  );
}
