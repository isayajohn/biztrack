import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Mail, Save } from "lucide-react";
import {
  getEmailTemplates,
  previewEmailTemplate,
  updateManagedEmailTemplate,
} from "../../services/adminApi";
import BrandLogo from "../../components/BrandLogo";
import type { EmailTemplatePreview, ManagedEmailTemplate, TemplateKey } from "../../services/adminApi";
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

type Draft = {
  subject: string;
  body: string;
  isActive: boolean;
};

function primaryAction(key: TemplateKey, variables: Record<string, string>) {
  if (key === "EMAIL_VERIFICATION") {
    return { label: "Verify account", href: variables.verificationLink };
  }
  if (key === "PASSWORD_RESET") {
    return { label: "Reset password", href: variables.resetLink };
  }
  return null;
}

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<ManagedEmailTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selectedKey, setSelectedKey] = useState<TemplateKey | null>(null);
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
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
    getEmailTemplates()
      .then((nextTemplates) => {
        setTemplates(nextTemplates);
        setSelectedKey((current) => current ?? nextTemplates[0]?.key ?? null);
        setDrafts(
          Object.fromEntries(
            nextTemplates.map((template) => [
              template.key,
              {
                subject: template.subject ?? "",
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

  function updateDraft(key: TemplateKey, patch: Partial<Draft>) {
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
      await updateManagedEmailTemplate(selectedTemplate.key, {
        subject: selectedDraft.subject,
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
      const result = await previewEmailTemplate(selectedTemplate.key);
      setPreview({
        ...result,
        subject: renderTemplateText(selectedDraft.subject, result.variables),
        body: renderTemplateText(selectedDraft.body, result.variables),
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
        <h1 className="mt-1 font-display text-xl font-bold text-ink">Email Templates</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">Edit database-backed auth and account email messages.</p>
      </div>

      {notice && <NoticeBanner notice={notice} />}

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="self-start rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 px-1 py-2">
            <Mail size={17} className="text-leaf" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Templates</h2>
          </div>
          <div className="mt-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
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
              {Array.from({ length: 5 }).map((_, index) => (
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

              <div className="mt-4 grid gap-3">
                <label className="text-sm font-bold text-ink/65">
                  Subject
                  <input value={selectedDraft.subject} onChange={(event) => updateDraft(selectedTemplate.key, { subject: event.target.value })} className={fieldClass} />
                </label>
                <label className="text-sm font-bold text-ink/65">
                  Body
                  <textarea value={selectedDraft.body} onChange={(event) => updateDraft(selectedTemplate.key, { body: event.target.value })} rows={8} className={fieldClass} />
                </label>
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
                  <p className="text-xs font-bold uppercase text-ink/40">Branded Preview</p>
                  <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
                    <div className="bg-[#101827] px-5 py-5 text-center">
                      <BrandLogo className="mx-auto h-auto w-56 max-w-full" variant="dark" />
                    </div>
                    <div className="px-5 py-5">
                      <h3 className="font-display text-xl font-bold text-ink">{preview.subject}</h3>
                      <div className="mt-4 space-y-3">
                        {(preview.body ?? "").split(/\n{2,}/).map((paragraph, index) => (
                          <p key={index} className="text-sm font-semibold leading-6 text-ink/65">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      {primaryAction(selectedTemplate.key, preview.variables) && (
                        <a
                          href={primaryAction(selectedTemplate.key, preview.variables)?.href}
                          className="mt-5 inline-flex rounded-xl bg-leaf px-5 py-3 text-sm font-extrabold text-white shadow-sm"
                        >
                          {primaryAction(selectedTemplate.key, preview.variables)?.label}
                        </a>
                      )}
                    </div>
                    <div className="border-t border-ink/10 px-5 py-4 text-xs font-semibold leading-5 text-ink/45">
                      This message was sent by BizTrack. If you did not request this, you can ignore this email.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
