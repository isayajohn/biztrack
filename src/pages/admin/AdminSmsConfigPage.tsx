import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MessageSquare, Save, Send } from "lucide-react";
import {
  getSmsSettings,
  sendTestSms,
  updateSmsConfig,
  updateSmsTemplate,
} from "../../services/adminApi";
import type { ConfigProvider, MessageTemplate, SmsSettings, TemplateKey } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type SmsForm = {
  provider: ConfigProvider;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  clearApiKey: boolean;
  clearApiSecret: boolean;
  senderId: string;
  isActive: boolean;
};

const emptyForm: SmsForm = {
  provider: "API",
  baseUrl: "",
  apiKey: "",
  apiSecret: "",
  clearApiKey: false,
  clearApiSecret: false,
  senderId: "",
  isActive: true,
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

function templateLabel(key: TemplateKey) {
  return key
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminSmsConfigPage() {
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [form, setForm] = useState<SmsForm>(emptyForm);
  const [drafts, setDrafts] = useState<Record<string, Pick<MessageTemplate, "subject" | "body" | "isActive">>>({});
  const [testTo, setTestTo] = useState("");
  const [testMessage, setTestMessage] = useState("Your BizTrack test code is 123456.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function load() {
    setIsLoading(true);
    getSmsSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
        if (nextSettings.config) {
          setForm({
            provider: nextSettings.config.provider,
            baseUrl: nextSettings.config.baseUrl ?? "",
            apiKey: "",
            apiSecret: "",
            clearApiKey: false,
            clearApiSecret: false,
            senderId: nextSettings.config.senderId ?? "",
            isActive: nextSettings.config.isActive,
          });
        }
        setDrafts(
          Object.fromEntries(
            nextSettings.templates.map((template) => [
              template.key,
              { subject: template.subject ?? "", body: template.body, isActive: template.isActive },
            ]),
          ),
        );
      })
      .catch((error) => setMessage({ type: "error", text: getApiErrorMessage(error) }))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function updateField<K extends keyof SmsForm>(key: K, value: SmsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateSmsConfig({
        provider: form.provider,
        baseUrl: form.baseUrl || null,
        apiKey: form.apiKey || null,
        apiSecret: form.apiSecret || null,
        clearApiKey: form.clearApiKey,
        clearApiSecret: form.clearApiSecret,
        senderId: form.senderId || null,
        isActive: form.isActive,
      });
      load();
      setMessage({ type: "success", text: "SMS configuration saved." });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTemplate(template: MessageTemplate) {
    const draft = drafts[template.key];
    if (!draft) return;

    setSavingTemplate(template.key);
    setMessage(null);
    try {
      await updateSmsTemplate(template.key, {
        subject: draft.subject || null,
        body: draft.body,
        isActive: draft.isActive,
      });
      load();
      setMessage({ type: "success", text: `${templateLabel(template.key)} template saved.` });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setSavingTemplate(null);
    }
  }

  async function testSms(event: React.FormEvent) {
    event.preventDefault();
    setIsTesting(true);
    setMessage(null);
    try {
      const result = await sendTestSms({ to: testTo, message: testMessage });
      setMessage({ type: "success", text: `Test SMS ${result.status.toLowerCase()} for ${result.toMasked}.` });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
        <h1 className="mt-1 font-display text-xl font-bold text-ink">SMS configuration</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">
          Manage sender ID, provider secrets, OTP templates, and test messages.
        </p>
      </div>

      {message && <Message type={message.type} text={message.text} />}

      <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <form onSubmit={saveConfig} className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-leaf" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-ink">Provider</h2>
            </div>

            {isLoading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-11 animate-pulse rounded-lg bg-ink/8" />
                ))}
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3">
                  <label className="text-sm font-bold text-ink/65">
                    Provider
                    <select
                      value={form.provider}
                      onChange={(event) => updateField("provider", event.target.value as ConfigProvider)}
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    >
                      <option value="API">API</option>
                      <option value="CUSTOM">CUSTOM</option>
                      <option value="SMTP">SMTP</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold text-ink/65">
                    Base URL
                    <input
                      value={form.baseUrl}
                      onChange={(event) => updateField("baseUrl", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                  </label>
                  <label className="text-sm font-bold text-ink/65">
                    Sender ID
                    <input
                      value={form.senderId}
                      onChange={(event) => updateField("senderId", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                  </label>
                  <label className="text-sm font-bold text-ink/65">
                    API key
                    <input
                      type="password"
                      value={form.apiKey}
                      placeholder={settings?.config?.apiKeyMasked ?? ""}
                      onChange={(event) => updateField("apiKey", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                  </label>
                  <label className="text-sm font-bold text-ink/65">
                    API secret
                    <input
                      type="password"
                      value={form.apiSecret}
                      placeholder={settings?.config?.apiSecretMasked ?? ""}
                      onChange={(event) => updateField("apiSecret", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-lg border border-ink/10 bg-[#fbfaf6] px-3 py-2 text-sm font-bold text-ink/65">
                      <input
                        type="checkbox"
                        checked={form.clearApiKey}
                        onChange={(event) => updateField("clearApiKey", event.target.checked)}
                        className="h-4 w-4 accent-leaf"
                      />
                      Clear API key
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-ink/10 bg-[#fbfaf6] px-3 py-2 text-sm font-bold text-ink/65">
                      <input
                        type="checkbox"
                        checked={form.clearApiSecret}
                        onChange={(event) => updateField("clearApiSecret", event.target.checked)}
                        className="h-4 w-4 accent-leaf"
                      />
                      Clear secret
                    </label>
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-ink/10 bg-[#fbfaf6] px-3 py-2 text-sm font-bold text-ink/65">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => updateField("isActive", event.target.checked)}
                      className="h-4 w-4 accent-leaf"
                    />
                    Active
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  Save SMS config
                </button>
              </>
            )}
          </form>

          <form onSubmit={testSms} className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Send size={18} className="text-leaf" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-ink">Test SMS</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                value={testTo}
                onChange={(event) => setTestTo(event.target.value)}
                placeholder="+255..."
                required
                className="rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
              <textarea
                value={testMessage}
                onChange={(event) => setTestMessage(event.target.value)}
                rows={3}
                required
                className="rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              />
            </div>
            <button
              type="submit"
              disabled={isTesting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8] disabled:opacity-60"
            >
              {isTesting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              Send test
            </button>
          </form>
        </div>

        <section className="rounded-xl border border-ink/10 bg-white shadow-sm">
          <div className="border-b border-ink/10 px-4 py-3">
            <h2 className="font-display text-base font-bold text-ink">Templates</h2>
          </div>
          <div className="divide-y divide-ink/8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse bg-ink/5 p-4" />
              ))
            ) : settings?.templates.length ? (
              settings.templates.map((template) => {
                const draft = drafts[template.key] ?? { subject: "", body: "", isActive: true };
                return (
                  <article key={template.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-extrabold text-ink">{templateLabel(template.key)}</h3>
                      <label className="flex items-center gap-2 text-sm font-bold text-ink/60">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [template.key]: { ...draft, isActive: event.target.checked },
                            }))
                          }
                          className="h-4 w-4 accent-leaf"
                        />
                        Active
                      </label>
                    </div>
                    <textarea
                      value={draft.body}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [template.key]: { ...draft, body: event.target.value },
                        }))
                      }
                      rows={5}
                      className="mt-3 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                    />
                    <button
                      type="button"
                      disabled={savingTemplate === template.key}
                      onClick={() => saveTemplate(template)}
                      className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8] disabled:opacity-60 sm:float-right"
                    >
                      {savingTemplate === template.key && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                      Save template
                    </button>
                    <div className="clear-both" />
                  </article>
                );
              })
            ) : (
              <p className="p-4 text-sm font-semibold text-ink/45">No templates found.</p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
