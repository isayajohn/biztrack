import { useEffect, useState } from "react";
import { Loader2, Mail, Save, Send } from "lucide-react";
import {
  getEmailConfig,
  sendTestEmail,
  updateEmailProviderConfig,
} from "../../services/adminApi";
import type { ConfigProvider, EmailConfig } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  fieldClass,
  Notice,
  NoticeBanner,
  primaryButtonClass,
  secondaryButtonClass,
} from "./AdminSettingsUi";

type EmailForm = {
  provider: ConfigProvider;
  host: string;
  port: string;
  username: string;
  password: string;
  apiKey: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  isActive: boolean;
};

const emptyForm: EmailForm = {
  provider: "SMTP",
  host: "",
  port: "",
  username: "",
  password: "",
  apiKey: "",
  fromName: "BizTrack",
  fromEmail: "",
  replyToEmail: "",
  isActive: true,
};

export default function AdminEmailProviderConfigPage() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [form, setForm] = useState<EmailForm>(emptyForm);
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  function load() {
    setIsLoading(true);
    getEmailConfig()
      .then((nextConfig) => {
        setConfig(nextConfig);
        if (!nextConfig) return;
        setForm({
          provider: nextConfig.provider,
          host: nextConfig.host ?? "",
          port: nextConfig.port ? String(nextConfig.port) : "",
          username: nextConfig.username ?? "",
          password: "",
          apiKey: "",
          fromName: nextConfig.fromName,
          fromEmail: nextConfig.fromEmail,
          replyToEmail: nextConfig.replyToEmail ?? "",
          isActive: nextConfig.isActive,
        });
      })
      .catch((error) => setNotice({ type: "error", text: getApiErrorMessage(error) }))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function updateField<K extends keyof EmailForm>(key: K, value: EmailForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    const confirmed = window.confirm("Save email configuration? Secret fields will only change if you entered new values.");
    if (!confirmed) return;

    setIsSaving(true);
    setNotice(null);
    try {
      await updateEmailProviderConfig({
        provider: form.provider,
        host: form.host || null,
        port: form.port ? Number(form.port) : null,
        username: form.username || null,
        ...(form.password.trim() ? { password: form.password } : {}),
        ...(form.apiKey.trim() ? { apiKey: form.apiKey } : {}),
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        replyToEmail: form.replyToEmail || null,
        isActive: form.isActive,
      });
      setNotice({ type: "success", text: "Email configuration saved." });
      load();
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function testConfig(event: React.FormEvent) {
    event.preventDefault();
    setIsTesting(true);
    setNotice(null);
    try {
      const result = await sendTestEmail({ to: testEmail });
      setNotice({ type: "success", text: `Test email sent to ${result.toMasked}.` });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
        <h1 className="mt-1 font-display text-xl font-bold text-ink">Email Config</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">Provider settings, masked credentials, and test delivery.</p>
      </div>

      {notice && <NoticeBanner notice={notice} />}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={saveConfig} className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-leaf" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Provider</h2>
          </div>

          {isLoading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-lg bg-ink/8" />
              ))}
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold text-ink/65">
                  Provider
                  <select value={form.provider} onChange={(event) => updateField("provider", event.target.value as ConfigProvider)} className={fieldClass}>
                    <option value="SMTP">SMTP</option>
                    <option value="API">API</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-ink/65">
                  Host
                  <input value={form.host} onChange={(event) => updateField("host", event.target.value)} className={fieldClass} />
                </label>
                <label className="text-sm font-bold text-ink/65">
                  Port
                  <input type="number" min={1} max={65535} value={form.port} onChange={(event) => updateField("port", event.target.value)} className={fieldClass} />
                </label>
                <label className="text-sm font-bold text-ink/65">
                  Username
                  <input value={form.username} onChange={(event) => updateField("username", event.target.value)} className={fieldClass} />
                </label>
                <label className="text-sm font-bold text-ink/65">
                  Password
                  <input type="password" value={form.password} placeholder={config?.passwordMasked ?? "Leave blank to keep saved password"} onChange={(event) => updateField("password", event.target.value)} className={fieldClass} />
                  {config?.passwordMasked && <span className="mt-1 block text-xs font-bold text-ink/40">Saved: {config.passwordMasked}</span>}
                </label>
                <label className="text-sm font-bold text-ink/65">
                  API key
                  <input type="password" value={form.apiKey} placeholder={config?.apiKeyMasked ?? "Leave blank to keep saved API key"} onChange={(event) => updateField("apiKey", event.target.value)} className={fieldClass} />
                  {config?.apiKeyMasked && <span className="mt-1 block text-xs font-bold text-ink/40">Saved: {config.apiKeyMasked}</span>}
                </label>
                <label className="text-sm font-bold text-ink/65">
                  From name
                  <input value={form.fromName} onChange={(event) => updateField("fromName", event.target.value)} required className={fieldClass} />
                </label>
                <label className="text-sm font-bold text-ink/65">
                  From email
                  <input type="email" value={form.fromEmail} onChange={(event) => updateField("fromEmail", event.target.value)} required className={fieldClass} />
                </label>
                <label className="text-sm font-bold text-ink/65">
                  Reply-to email
                  <input type="email" value={form.replyToEmail} onChange={(event) => updateField("replyToEmail", event.target.value)} className={fieldClass} />
                </label>
                <label className="mt-6 flex min-h-10 items-center gap-2 rounded-lg border border-ink/10 bg-[#f7faf9] px-3 py-2 text-sm font-bold text-ink/65">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} className="h-4 w-4 accent-leaf" />
                  Active
                </label>
              </div>

              <button type="submit" disabled={isSaving} className={`${primaryButtonClass} mt-5`}>
                {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                Save Email Config
              </button>
            </>
          )}
        </form>

        <form onSubmit={testConfig} className="self-start rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-leaf" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Test Email</h2>
          </div>
          <label className="mt-4 block text-sm font-bold text-ink/65">
            Recipient
            <input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} required className={fieldClass} />
          </label>
          <button type="submit" disabled={isTesting} className={`${secondaryButtonClass} mt-4 w-full`}>
            {isTesting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            Send Test
          </button>
        </form>
      </div>
    </div>
  );
}
