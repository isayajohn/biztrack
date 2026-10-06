import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import LandingFooter from "../components/landing/LandingFooter";
import LandingNavbar from "../components/landing/LandingNavbar";
import { useSeo } from "../hooks/useSeo";
import { getApiErrorMessage } from "../services/apiClient";
import { getLegalDocument, type LegalDocument } from "../services/legalApi";

const DESCRIPTION = "Learn how BizTrack collects, uses, protects and manages personal and business information across its web and mobile services.";

export default function PrivacyPolicyPage() {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState("");

  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: document?.title ?? "BizTrack Privacy Policy",
    url: "https://biztracktanzania.online/privacy-policy",
    description: document?.summary ?? DESCRIPTION,
    ...(document?.effectiveDate ? { datePublished: document.effectiveDate } : {}),
    ...(document?.publishedAt ? { dateModified: document.publishedAt } : {}),
  }), [document]);

  useSeo({
    title: "Privacy Policy | BizTrack Tanzania",
    description: document?.summary ?? DESCRIPTION,
    path: "/privacy-policy",
    structuredData,
  });

  useEffect(() => {
    let active = true;
    getLegalDocument("privacy")
      .then((value) => { if (active) setDocument(value); })
      .catch((reason) => { if (active) setError(getApiErrorMessage(reason)); });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#050811] text-white">
      <LandingNavbar />
      <main>
        <header className="relative overflow-hidden border-b border-white/[0.07] px-5 pb-16 pt-36 sm:px-8 sm:pb-20 sm:pt-44">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-[#12e4d7]/[0.07] blur-[140px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/45 hover:text-white"><ArrowLeft size={15} /> Back to home</Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#12e4d7]/20 bg-[#12e4d7]/[0.06] px-4 py-2 text-xs font-bold text-[#55e7c3]"><ShieldCheck size={14} /> Legal &amp; privacy</div>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">{document?.title ?? "Privacy Policy"}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/45 sm:text-lg">{document?.summary ?? DESCRIPTION}</p>
            {document && <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-white/40"><span className="rounded-full border border-white/10 px-3 py-1.5">Effective {formatDate(document.effectiveDate)}</span><span className="rounded-full border border-white/10 px-3 py-1.5">Version {document.version}</span></div>}
          </div>
        </header>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <article className="mx-auto max-w-4xl">
            {!document && !error && <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/50"><Loader2 className="animate-spin text-[#12e4d7]" size={20} /> Loading the current Privacy Policy…</div>}
            {error && <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6"><p className="font-semibold text-red-200">The Privacy Policy could not be loaded.</p><p className="mt-2 text-sm text-white/45">{error} Please refresh this page or contact info@afrigotech.com.</p></div>}
            {document && <div className="space-y-6">{document.sections.map((section, index) => <section key={`${section.heading}-${index}`} className="rounded-[1.5rem] border border-white/[0.08] bg-[#0a0f1b] p-6 sm:p-9"><div className="flex gap-4"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#12e4d7]/10 text-[#55e7c3]"><FileText size={17} /></span><div><h2 className="font-display text-xl font-semibold text-white/90 sm:text-2xl">{section.heading}</h2><p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-white/50">{section.body}</p></div></div></section>)}</div>}
          </article>
        </section>
      </main>
      <LandingFooter tagline="Your trust matters. BizTrack handles business and personal information with care and transparency." />
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
