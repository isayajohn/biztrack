import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "./LandingDesignSystem";

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

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Still have questions? We'd love to help."
          align="center"
        />

        {/* Accordion */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-cloud shadow-sm">
          {faqs.map(({ question, answer }, index) => (
            <div key={question} className="border-b border-slate-200 last:border-b-0">
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white"
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-display text-base font-semibold text-ink">
                  {question}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slateMuted transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              {openIndex === index && (
                <div className="border-t border-slate-200 bg-white px-6 py-5">
                  <p className="text-sm leading-7 text-slateMuted">{answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
