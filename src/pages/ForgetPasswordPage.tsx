import { useState, useCallback } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
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
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none",
    "transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#fbfaf6] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

export default function ForgetPasswordPage() {
  const navigate = useNavigate();
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfaf6] px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <BrandLogo className="h-auto w-56 max-w-full" />
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
            <div className="mb-4 flex justify-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-mint">
                <Mail size={24} className="text-leaf" />
              </div>
            </div>
            <h1 className="text-center font-display text-xl font-bold text-ink">
              Check your email
            </h1>
            <p className="mt-2 text-center text-sm text-ink/55">
              We have sent password reset instructions to <br />
              <span className="font-semibold text-ink">{email}</span>
            </p>
            <p className="mt-6 text-center text-xs text-ink/45">
              Didn't receive the email? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="font-semibold text-leaf hover:underline"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfaf6] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo className="h-auto w-56 max-w-full" />
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
          <h1 className="font-display text-xl font-bold text-ink">
            Forgot password?
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Enter your email and we'll send you reset instructions.
          </p>

          {errors.general && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.general}
            </div>
          )}

          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>
        </div>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
