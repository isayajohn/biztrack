import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { TemplateKey } from "../../services/adminApi";

export type Notice = { type: "success" | "error"; text: string };

export const fieldClass =
  "mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-60";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60";

export function NoticeBanner({ notice }: { notice: Notice }) {
  const Icon = notice.type === "success" ? CheckCircle2 : AlertCircle;
  const classes = notice.type === "success" ? "border-leaf/20 bg-mint text-leaf" : "border-red-200 bg-red-50 text-red-600";

  return (
    <div className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{notice.text}</span>
    </div>
  );
}

export function templateLabel(key: TemplateKey | string) {
  return key
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

export function VariableList({ variables }: { variables?: string[] }) {
  if (!variables?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {variables.map((variable) => (
        <span key={variable} className="rounded-md bg-ink/6 px-2 py-1 text-xs font-bold text-ink/55">
          {`{{${variable}}}`}
        </span>
      ))}
    </div>
  );
}

export function renderTemplateText(template: string, variables: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (_match, variable: string) => {
    return variables[variable] ?? "";
  });
}
