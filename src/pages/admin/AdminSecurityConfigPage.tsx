import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, ShieldCheck } from "lucide-react";
import { getSecurityConfig, updateSecurityConfig } from "../../services/adminApi";
import type { SecurityConfig } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type SecurityForm = Omit<SecurityConfig, "id" | "createdAt" | "updatedAt">;

const defaults: SecurityForm = {
  requireEmailVerification: true,
  enablePasswordReset: true,
  enableOtpLogin: false,
  enableSmsOtp: false,
  passwordMinLength: 8,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  otpExpiryMinutes: 10,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  sessionExpiryMinutes: 1440,
};

function Message({ type, text }: { type: "success" | "error"; text: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const classes = type === "success" ? "border-leaf/20 bg-mint text-leaf" : "border-red-200 bg-red-50 text-red-600";
  return (
    <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export default function AdminSecurityConfigPage() {
  const [form, setForm] = useState<SecurityForm>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getSecurityConfig()
      .then((config) => {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...nextForm } = config;
        setForm(nextForm);
      })
      .catch((error) => setMessage({ type: "error", text: getApiErrorMessage(error) }))
      .finally(() => setIsLoading(false));
  }, []);

  function updateField<K extends keyof SecurityForm>(key: K, value: SecurityForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const confirmed = window.confirm("Save security configuration? These settings affect account access for all users.");
    if (!confirmed) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await updateSecurityConfig(form);
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...nextForm } = saved;
      setForm(nextForm);
      setMessage({ type: "success", text: "Security configuration saved." });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
        <h1 className="mt-1 font-display text-xl font-bold text-ink">Account security</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">
          Configure verification, OTP, sessions, passwords, and lockout rules.
        </p>
      </div>

      {message && <Message type={message.type} text={message.text} />}

      <form onSubmit={save} className="mt-5 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-leaf" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-ink">Security rules</h2>
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-ink/8" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["requireEmailVerification", "Require email verification"],
                ["enablePasswordReset", "Enable password reset"],
                ["enableOtpLogin", "Enable OTP login"],
                ["enableSmsOtp", "Enable SMS OTP"],
                ["passwordRequireNumber", "Password requires number"],
                ["passwordRequireSpecialChar", "Password requires special character"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-ink/10 bg-[#fbfaf6] px-3 py-2 text-sm font-bold text-ink/65">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof SecurityForm])}
                    onChange={(event) => updateField(key as keyof SecurityForm, event.target.checked as never)}
                    className="h-4 w-4 accent-leaf"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["passwordMinLength", "Password min length", 6, 128],
                ["otpExpiryMinutes", "OTP expiry minutes", 1, 60],
                ["maxLoginAttempts", "Max login attempts", 1, 20],
                ["lockoutMinutes", "Lockout minutes", 1, 1440],
                ["sessionExpiryMinutes", "Session expiry minutes", 5, 43200],
              ].map(([key, label, min, max]) => (
                <label key={key as string} className="text-sm font-bold text-ink/65">
                  {label as string}
                  <input
                    type="number"
                    min={min as number}
                    max={max as number}
                    value={form[key as keyof SecurityForm] as number}
                    onChange={(event) => updateField(key as keyof SecurityForm, Number(event.target.value) as never)}
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                Save security
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
