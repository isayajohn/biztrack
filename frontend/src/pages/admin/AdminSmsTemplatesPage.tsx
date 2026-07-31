import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, MessageSquare, Save } from "lucide-react";
import {
  getSmsTemplates,
  previewSmsTemplate,
  updateManagedSmsTemplate,
} from "../../services/adminApi";
import type { ManagedSmsTemplate, SmsTemplatePreview } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  fieldClass,
  Notice,
  NoticeBanner,
  primaryButtonClass,
  renderTemplateText,
  secondaryButtonClass,
  templateLabel,
  VariableList,
} from "./AdminSettingsUi";

type SmsTemplateKey = ManagedSmsTemplate["key"];
type Draft = {
  body: string;
  isActive: boolean;
};

export default function AdminSmsTemplatesPage() {
  const [templates, setTemplates] = useState<ManagedSmsTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedKey, setSelectedKey] = useState<SmsTemplateKey | null>(null);
  const [preview, setPreview] = useState<SmsTemplatePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedKey) ?? templates[0],
    [selectedKey, templates],
  );
  const selectedDraft = selectedTemplate ? drafts[selectedTemplate.key] : null;

  function load() {
    setIsLoading(true);
    getSmsTemplates()
      .then((nextTemplates) => {
        setTemplates(nextTemplates);
        setSelectedKey((current) => current ?? nextTemplates[0]?.key ?? null);
        setDrafts(
          Object.fromEntries(
            nextTemplates.map((template) => [
              template.key,
              {
                body: template.body,
                isActive: template.isActive,
              },
            ]),
          ),
        );
      })
      .catch((error) => setNotice({ type: "error", text: getApiErrorMessage(error) }))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function updateDraft(key: SmsTemplateKey, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
    setPreview(null);
  }

  async function saveTemplate() {
    if (!selectedTemplate || !selectedDraft) return;
    setIsSaving(true);
    setNotice(null);
    try {
      await updateManagedSmsTemplate(selectedTemplate.key, {
        body: selectedDraft.body,
        isActive: selectedDraft.isActive,
      });
      setNotice({ type: "success", text: `${templateLabel(selectedTemplate.key)} template saved.` });
      load();
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function previewTemplate() {
    if (!selectedTemplate || !selectedDraft) return;
    setIsPreviewing(true);
    setNotice(null);
    try {
      const result = await previewSmsTemplate(selectedTemplate.key);
      const body = renderTemplateText(selectedDraft.body, result.variables);
      setPreview({
        ...result,
        body,
        characterCount: body.length,
      });
    } catch (error) {
      setNotice({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
        <h1 className="mt-1 font-display text-xl font-bold text-ink">SMS Templates</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">Edit compact SMS bodies for OTP, account, and subscription events.</p>
      </div>

      {notice && <NoticeBanner notice={notice} />}

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="self-start rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 px-1 py-2">
            <MessageSquare size={17} className="text-leaf" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Templates</h2>
          </div>
          <div className="mt-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-lg bg-ink/8" />
              ))
            ) : (
              templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(template.key);
                    setPreview(null);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors",
                    selectedTemplate?.key === template.key ? "bg-leaf text-white" : "text-ink/62 hover:bg-ink/6 hover:text-ink",
                  ].join(" ")}
                >
                  <span className="truncate">{templateLabel(template.key)}</span>
                  <span className="ml-2 h-2 w-2 rounded-full bg-current opacity-60" />
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          {isLoading || !selectedTemplate || !selectedDraft ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-ink/8" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">{templateLabel(selectedTemplate.key)}</h2>
                  <div className="mt-2">
                    <VariableList variables={selectedTemplate.requiredVariables} />
                  </div>
                </div>
                <label className="flex items-center gap-2 rounded-lg border border-ink/10 bg-[#f7faf9] px-3 py-2 text-sm font-bold text-ink/65">
                  <input type="checkbox" checked={selectedDraft.isActive} onChange={(event) => updateDraft(selectedTemplate.key, { isActive: event.target.checked })} className="h-4 w-4 accent-leaf" />
                  Active
                </label>
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold text-ink/65">
                  Body
                  <textarea value={selectedDraft.body} onChange={(event) => updateDraft(selectedTemplate.key, { body: event.target.value })} rows={7} maxLength={320} className={fieldClass} />
                </label>
                <div className="mt-2 flex justify-end text-xs font-bold text-ink/40">
                  {selectedDraft.body.length}/320
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={previewTemplate} disabled={isPreviewing} className={secondaryButtonClass}>
                  {isPreviewing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  Preview
                </button>
                <button type="button" onClick={saveTemplate} disabled={isSaving} className={primaryButtonClass}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  Save Template
                </button>
              </div>

              {preview && (
                <div className="mt-5 rounded-lg border border-ink/10 bg-[#f7faf9] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase text-ink/40">Preview</p>
                    <span className="text-xs font-bold text-ink/40">{preview.characterCount} chars</span>
                  </div>
                  <p className="mt-3 rounded-lg bg-white p-3 text-sm font-semibold leading-6 text-ink/70">{preview.body}</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
