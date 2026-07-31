import { XCircle } from "lucide-react";

type ProblemItemContent = {
  quote?: unknown;
  detail?: unknown;
};

type Props = {
  content?: Record<string, unknown> | null;
};

function textFrom(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

const DEFAULT_EYEBROW = "Sound familiar?";
const DEFAULT_TITLE = "Running a business blind is stressful";
const DEFAULT_DESCRIPTION =
  "Most small business owners face the same problems every day. BizTrack solves all of them in one place.";

const DEFAULT_ITEMS = [
  {
    quote: "I don't know if I made profit today",
    detail: "Without tracking, it's impossible to tell if your business is actually growing.",
  },
  {
    quote: "I forget expenses",
    detail: "Small costs add up fast. Forgetting them means you never see the real picture.",
  },
  {
    quote: "I lose sales records",
    detail: "Paper records get lost, damaged, or forgotten. Your data should be safe and searchable.",
  },
  {
    quote: "I don't know when stock is low",
    detail: "Running out of products means losing customers — and you might not even notice until it's too late.",
  },
];

export default function ProblemSection({ content }: Props) {
  const record = content && typeof content === "object" && !Array.isArray(content)
    ? content
    : null;

  const eyebrow = textFrom(record?.eyebrow) || DEFAULT_EYEBROW;
  const title = textFrom(record?.title) || DEFAULT_TITLE;
  const description = textFrom(record?.description) || DEFAULT_DESCRIPTION;

  const rawItems = Array.isArray(record?.items) ? (record!.items as ProblemItemContent[]) : [];
  const dynamicItems = rawItems
    .map((item) => ({ quote: textFrom(item.quote), detail: textFrom(item.detail) }))
    .filter((item) => item.quote);

  const problems = dynamicItems.length ? dynamicItems : DEFAULT_ITEMS;

  return (
    <section className="bg-ink py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8af0d5]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-base leading-7 text-slate-300">
              {description}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(({ quote, detail }) => (
            <article
              key={quote}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-[#8af0d5]">
                <XCircle size={20} aria-hidden="true" />
              </span>
              <p className="text-base font-bold italic text-white/90">
                "{quote}"
              </p>
              {detail && <p className="mt-3 text-sm leading-6 text-white/50">{detail}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
