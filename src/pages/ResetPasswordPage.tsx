import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { resetPassword } from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

type FormErrors = {
  password?: string;
  general?: string;
};

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none",
    "transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#f7faf9] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!token) {
        setErrors({ general: "Invalid reset token." });
        return;
      }

      const errs: FormErrors = {};
      if (!password) errs.password = "Password is required.";
      else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
      else if (password !== confirmPassword) errs.password = "Passwords do not match.";

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }

      setErrors({});
      setIsLoading(true);
      try {
        await resetPassword(token, password);
        setIsSuccess(true);
      } catch (err) {
        setErrors({ general: getApiErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [token, password, confirmPassword],
  );

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7faf9] px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <BrandLogo className="h-auto w-56 max-w-full" />
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
            <div className="mb-4 flex justify-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-mint">
                <Lock size={24} className="text-leaf" />
              </div>
            </div>
            <h1 className="text-center font-display text-xl font-bold text-ink">
              Password reset
            </h1>
            <p className="mt-2 text-center text-sm text-ink/55">
              Your password has been reset successfully.
            </p>
            <Link
              to="/login"
              className="mt-6 block w-full rounded-xl bg-leaf py-3 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-leaf/90"
            >
              Sign in with new password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7faf9] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo className="h-auto w-56 max-w-full" />
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
          <h1 className="font-display text-xl font-bold text-ink">
            Reset password
          </h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Enter your new password below.
          </p>

          {errors.general && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.general}
            </div>
          )}

          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-ink">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                className={inputCls(!!errors.password)}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "pw-error" : undefined}
              />
              {errors.password && (
                <p id="pw-error" className="mt-1 text-xs font-medium text-red-500">
                  {errors.password}
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
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
