import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircleQuestion, Search } from "lucide-react";

const faqs = [
  {
    question: "Is BizTrack free?",
    answer:
      "Yes! BizTrack has a free plan that includes sales tracking, expense tracking, and a basic dashboard — with no time limit. You only upgrade if you need advanced features like inventory alerts, PDF reports, or multi-user access.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "Absolutely. BizTrack is mobile-first and works great on any smartphone browser — no app download needed. It's designed to be fast and easy to use with one hand while serving customers.",
  },
  {
    question: "Can I track stock?",
    answer:
      "Yes. You can add your products with quantities, and BizTrack will track stock levels as you record sales. Low-stock alerts are available on the Pro and Business plans.",
  },
  {
    question: "Can I export reports?",
    answer:
      "PDF report exports are available on the Pro and Business plans. You can download weekly or monthly summaries of your sales, expenses, and profit to share or keep for your records.",
  },
  {
    question: "Do I need accounting knowledge?",
    answer:
      "Not at all. BizTrack is built for everyday business owners — not accountants. Everything is explained in plain language, and the dashboard gives you all the numbers you need without any jargon.",
  },
];

type FaqContent = {
  question?: unknown;
  title?: unknown;
  answer?: unknown;
  text?: unknown;
};

function textFrom(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeFaqs(items?: FaqContent[] | null) {
  const dynamicFaqs = Array.isArray(items)
    ? items
        .map((item) => ({
          question: textFrom(item.question) || textFrom(item.title),
          answer: textFrom(item.answer) || textFrom(item.text),
        }))
        .filter((item) => item.question && item.answer)
    : [];

  return dynamicFaqs.length ? dynamicFaqs : faqs;
}

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  faqs?: FaqContent[] | null;
};

export default function FAQSection({ eyebrow, title, description, faqs: dynamicFaqs }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const visibleFaqs = normalizeFaqs(dynamicFaqs);

  const filteredFaqs = visibleFaqs.filter(({ question, answer }) => {
    const haystack = `${question} ${answer}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-leaf">{eyebrow || "FAQ"}</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-normal text-ink sm:text-5xl">
            {title || "Frequently asked questions"}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slateMuted">
            {description || "Search common questions about using BizTrack for sales, expenses, stock, reports, and daily profit tracking."}
          </p>

          <label className="relative mt-7 block" htmlFor="faq-search">
            <Search
              size={20}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slateMuted/55"
              aria-hidden="true"
            />
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenIndex(null);
              }}
              placeholder="Search question here"
              className="h-13 w-full rounded-full border border-slate-200 bg-cloud px-5 py-4 pr-12 text-sm font-semibold text-ink outline-none transition-all placeholder:text-slateMuted/60 focus:border-leaf focus:bg-white focus:ring-4 focus:ring-leaf/15"
            />
          </label>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map(({ question, answer }, index) => (
                <div key={question} className="border-b border-slate-200 last:border-b-0">
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-cloud"
                    onClick={() => toggle(index)}
                    aria-expanded={openIndex === index}
                  >
                    <span className="font-display text-base font-bold text-ink">{question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slateMuted transition-transform duration-200 ${
                        openIndex === index ? "rotate-180 text-leaf" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {openIndex === index && (
                    <div className="border-t border-slate-200 bg-cloud px-5 py-4">
                      <p className="text-sm leading-7 text-slateMuted">{answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="font-display text-base font-bold text-ink">No matching questions</p>
                <p className="mt-2 text-sm leading-6 text-slateMuted">
                  Try searching for sales, expenses, stock, reports, or phone.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="relative min-h-[380px] overflow-hidden rounded-xl border border-leaf/15 bg-cloud p-8 shadow-card sm:min-h-[440px]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_48%)]"
            aria-hidden="true"
          />
          <div className="relative flex h-full min-h-[320px] items-center justify-center">
            <span
              className="absolute left-2 top-4 font-display text-8xl font-extrabold text-leaf/[0.08] sm:text-9xl"
              aria-hidden="true"
            >
              F
            </span>
            <span
              className="absolute bottom-3 right-0 font-display text-8xl font-extrabold text-leaf/[0.08] sm:text-9xl"
              aria-hidden="true"
            >
              Q
            </span>

            <div className="relative grid h-56 w-56 place-items-center rounded-full bg-white shadow-card ring-1 ring-leaf/15 sm:h-64 sm:w-64">
              <div className="absolute h-72 w-72 rounded-full border border-leaf/10" aria-hidden="true" />
              <div className="absolute h-44 w-44 rounded-full border border-leaf/15" aria-hidden="true" />
              <div className="grid h-24 w-24 place-items-center rounded-full bg-leaf text-white shadow-card ring-8 ring-leaf/15">
                <HelpCircle size={46} aria-hidden="true" />
              </div>
            </div>

            <div className="absolute right-4 top-8 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <MessageCircleQuestion size={20} className="text-leaf" aria-hidden="true" />
              <p className="mt-2 text-xs font-extrabold text-ink">Quick answers</p>
            </div>

            <div className="absolute bottom-8 left-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slateMuted">Support</p>
              <p className="mt-1 text-sm font-extrabold text-ink">Simple guidance</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
