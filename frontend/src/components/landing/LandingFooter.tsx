import { ArrowUpRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  seoDescription?: string | null;
  footerLinks?: Array<Record<string, unknown>> | null;
  tagline?: string | null;
  badge?: string | null;
  productLinks?: Array<Record<string, unknown>> | null;
  companyLinks?: Array<Record<string, unknown>> | null;
};

const PRODUCT_LINKS = [
  ["Product tour", "/#product-tour"],
  ["Features", "/#features"],
  ["AI Copilot", "/#ai-copilot"],
  ["Pricing", "/#pricing"],
];

const COMPANY_LINKS = [
  ["About", "/about"],
  ["Why BizTrack", "/#why-biztrack"],
  ["Contact", "/#contact"],
  ["Create account", "/register"],
  ["Log in", "/login"],
];

function FooterLink({ label, href }: { label: string; href: string }) {
  const classes = "inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white";
  return href.startsWith("/") ? <Link to={href} className={classes}>{label}</Link> : <a href={href} className={classes}>{label}</a>;
}

export default function LandingFooter({ seoDescription, tagline }: Props) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050706] text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.7fr_1fr]">
          <div>
            <Link to="/" aria-label="BizTrack home">
              <img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="h-auto w-44" />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/[0.35]">
              {tagline || seoDescription || "One operating system for ambitious African businesses — sales, inventory, finance and intelligence in real time."}
            </p>
            <span className="mt-6 inline-flex rounded-full border border-[#12e4d7]/20 bg-[#12e4d7]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#12e4d7]">
              Built for growing businesses
            </span>
          </div>

          <nav aria-label="Product links">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Product</p>
            <ul className="space-y-3.5">
              {PRODUCT_LINKS.map(([label, href]) => <li key={label}><FooterLink label={label} href={href} /></li>)}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Company</p>
            <ul className="space-y-3.5">
              {COMPANY_LINKS.map(([label, href]) => <li key={label}><FooterLink label={label} href={href} /></li>)}
            </ul>
          </nav>

          <div>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Contact</p>
            <a href="mailto:info@afrigotech.com" className="group block rounded-2xl border border-white/10 bg-white/[0.025] p-4 hover:border-[#12e4d7]/25 hover:bg-white/[0.045]">
              <span className="flex items-center justify-between text-[#12e4d7]"><Mail size={18} /><ArrowUpRight size={16} /></span>
              <span className="mt-4 block text-xs text-white/30">Email our team</span>
              <span className="mt-1 block break-all text-sm font-semibold text-white/70">info@afrigotech.com</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/[0.08] py-7 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BizTrack. All rights reserved.</p>
          <div className="flex gap-5"><a href="#" className="hover:text-white/50">Privacy</a><a href="#" className="hover:text-white/50">Terms</a></div>
        </div>
      </div>
    </footer>
  );
}
