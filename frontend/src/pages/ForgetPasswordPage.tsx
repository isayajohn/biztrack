import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useNoIndex } from "../hooks/useSeo";
import { forgotPassword } from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  email?: string;
  general?: string;
};

function validate(email: string): FormErrors {
  const errs: FormErrors = {};
  if (!email.trim()) errs.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
  return errs;
}

function inputCls(hasError?: boolean) {
  return `h-12 w-full rounded-xl border bg-white/[0.075] px-11 pr-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-white/35 focus:ring-4 ${
    hasError
      ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/10"
      : "border-white/15 focus:border-emerald-400/60 focus:ring-emerald-400/10"
  }`;
}

export default function ForgetPasswordPage() {
  useNoIndex();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate(email);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setIsLoading(true);
      try {
        await forgotPassword(email);
        setIsSubmitted(true);
      } catch (err) {
        setErrors({ general: getApiErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [email],
  );

  if (isSubmitted) {
    return (
      <AuthShell>
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-300 shadow-[0_15px_40px_-15px_rgba(16,185,129,0.65)]">
            <MailCheck size={26} aria-hidden="true" />
          </span>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-100">
            Reset link requested
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white">Check your email.</h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-white/60">
            If an account exists for this address, we&apos;ve sent secure password reset instructions to
          </p>
          <p className="mt-2 break-all text-sm font-bold text-emerald-300">{email}</p>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs leading-5 text-white/50">
            The link expires for your security. Check your spam folder if it does not appear in your inbox.
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
          >
            <Mail size={15} aria-hidden="true" /> Try another email
          </button>
          <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-white/45 hover:text-white">
            <ArrowLeft size={14} aria-hidden="true" /> Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-100">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" /> Account recovery
      </span>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white">Forgot your password?</h1>
      <p className="mt-2 text-[15px] leading-6 text-white/60">
        Enter the email linked to your BizTrack account and we&apos;ll send you a secure reset link.
      </p>

      {errors.general && (
        <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {errors.general}
        </div>
      )}

      <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-white/90">Email address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" aria-hidden="true" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
              }}
              className={inputCls(Boolean(errors.email))}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && <p id="email-error" className="mt-1.5 text-xs font-semibold text-red-300">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-bold text-[#031b12] shadow-[0_15px_40px_-12px_rgba(16,185,129,0.7)] transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <><Loader2 size={17} className="animate-spin" aria-hidden="true" /> Sending reset link...</> : <>Send reset link <ArrowRight size={17} aria-hidden="true" /></>}
        </button>
      </form>

      <Link to="/login" className="mt-7 flex items-center justify-center gap-2 text-xs font-semibold text-white/45 hover:text-white">
        <ArrowLeft size={14} aria-hidden="true" /> Back to sign in
      </Link>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#07102b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/auth-bg.jpg')" }} />
      <div className="pointer-events-none absolute inset-0 bg-[#07102b]/45" />

      <header className="relative z-10 flex items-center justify-between px-5 pb-4 pt-7 sm:px-8 sm:pt-9">
        <Link to="/" aria-label="BizTrack home"><img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="h-auto w-40" /></Link>
        <Link to="/about" className="hidden text-sm font-semibold text-white/60 hover:text-white sm:block">About BizTrack</Link>
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 pt-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber-100/20 bg-[#071032]/75 p-7 shadow-[0_40px_100px_-30px_rgba(3,7,30,0.88),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
          <div className="relative">{children}</div>
        </div>
      </section>

      <footer className="relative z-10 pb-6 text-center text-xs text-white/45">
        <span className="inline-flex items-center gap-2"><Sparkles size={13} aria-hidden="true" /> Secure business management for growing teams</span>
      </footer>
    </main>
  );
}
