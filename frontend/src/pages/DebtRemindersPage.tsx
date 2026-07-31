import { useEffect, useState } from "react";
import { BellRing, Loader2, Save } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getDebtReminderTemplates,
  getDebtSettings,
  updateDebtReminderTemplate,
  updateDebtSettings,
} from "../services/debtApi";
import type { DebtReminderTemplate, DebtSettings, ReminderChannel } from "../services/debtApi";

const CHANNELS: ReminderChannel[] = ["SMS", "WHATSAPP", "EMAIL", "IN_APP"];

function TemplateEditor({ template, onSaved }: { template: DebtReminderTemplate; onSaved: (t: DebtReminderTemplate) => void }) {
  const [subject, setSubject] = useState(template.subject ?? "");
  const [body, setBody] = useState(template.body);
  const [isActive, setIsActive] = useState(template.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateDebtReminderTemplate(template.channel, template.triggerType, { subject: subject || undefined, body, isActive });
      onSaved(updated);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">{template.channel} · {template.triggerType.split("_").join(" ")}</p>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink/50">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
      </div>
      {template.channel === "EMAIL" && (
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
      <button onClick={() => void save()} disabled={saving} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save template
      </button>
    </div>
  );
}

export default function DebtRemindersPage() {
  const [settings, setSettings] = useState<DebtSettings | null>(null);
  const [templates, setTemplates] = useState<DebtReminderTemplate[]>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    Promise.all([getDebtSettings(), getDebtReminderTemplates()])
      .then(([s, t]) => {
        setSettings(s);
        setTemplates(t.templates);
        setVariables(t.supportedVariables);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      const updated = await updateDebtSettings(settings);
      setSettings(updated);
      setSettingsSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleChannel = (channel: ReminderChannel) => {
    if (!settings) return;
    const enabled = settings.enabledChannels.includes(channel)
      ? settings.enabledChannels.filter((c) => c !== channel)
      : [...settings.enabledChannels, channel];
    setSettings({ ...settings, enabledChannels: enabled });
  };

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-sm font-semibold text-ink/45">Loading reminder settings…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <div className="flex items-center gap-2">
        <BellRing size={20} className="text-leaf" />
        <h1 className="font-display text-xl font-bold text-ink">Debt Reminders</h1>
      </div>
      <p className="mt-1 text-sm text-ink/50">Configure when reminders go out and customize what they say.</p>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {settings && (
        <section className="mt-5 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="text-sm font-bold text-ink">Schedule</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
              Remind before due date (days, comma separated)
              <input
                value={settings.remindDaysBefore.join(", ")}
                onChange={(e) => setSettings({ ...settings, remindDaysBefore: e.target.value.split(",").map((v) => parseInt(v.trim(), 10)).filter((n) => !isNaN(n) && n > 0) })}
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
              Repeat every (days) after due
              <input type="number" min={1} value={settings.remindAfterDueRepeatDays} onChange={(e) => setSettings({ ...settings, remindAfterDueRepeatDays: parseInt(e.target.value, 10) || 1 })} className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-ink/50">
              Max reminders after due
              <input type="number" min={0} value={settings.remindAfterDueMaxTimes} onChange={(e) => setSettings({ ...settings, remindAfterDueMaxTimes: parseInt(e.target.value, 10) || 0 })} className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" checked={settings.remindOnDueDate} onChange={(e) => setSettings({ ...settings, remindOnDueDate: e.target.checked })} /> Remind on the due date
            </label>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-ink/50">Enabled channels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHANNELS.map((channel) => (
                <button key={channel} type="button" onClick={() => toggleChannel(channel)} className={["rounded-xl px-3.5 py-2 text-sm font-bold transition-colors", settings.enabledChannels.includes(channel) ? "bg-leaf text-white" : "border border-ink/15 text-ink/60 hover:bg-[#eef8f4]"].join(" ")}>
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={settings.allowOverpayments} onChange={(e) => setSettings({ ...settings, allowOverpayments: e.target.checked })} /> Allow overpayments beyond the outstanding balance
          </label>

          <button onClick={() => void saveSettings()} disabled={savingSettings} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {savingSettings && <Loader2 size={14} className="animate-spin" />} Save settings
          </button>
          {settingsSaved && <span className="ml-3 text-xs font-semibold text-leaf">Saved.</span>}
        </section>
      )}

      <section className="mt-5">
        <h2 className="text-sm font-bold text-ink">Reminder templates</h2>
        <p className="mt-1 text-xs text-ink/45">Available variables: {variables.map((v) => `{{${v}}}`).join(", ")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <TemplateEditor key={`${t.channel}-${t.triggerType}`} template={t} onSaved={(updated) => setTemplates((prev) => prev.map((p) => (p.channel === updated.channel && p.triggerType === updated.triggerType ? updated : p)))} />
          ))}
        </div>
      </section>
    </div>
  );
}
