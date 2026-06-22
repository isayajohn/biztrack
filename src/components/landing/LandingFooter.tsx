import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import BrandLogo from "../BrandLogo";

const DEFAULT_PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "View Demo", href: "/demo" },
];

const DEFAULT_COMPANY_LINKS = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#contact" },
];

const DEFAULT_TAGLINE = "Simple sales and expense tracking for small businesses. Know your numbers, grow your business.";
const DEFAULT_BADGE = "Free to get started";

type NavLink = { label: string; href: string };

type Props = {
  seoDescription?: string | null;
  footerLinks?: Array<Record<string, unknown>> | null;
  tagline?: string | null;
  badge?: string | null;
  productLinks?: Array<Record<string, unknown>> | null;
  companyLinks?: Array<Record<string, unknown>> | null;
};

function textFrom(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function contactItemsFrom(footerLinks?: Array<Record<string, unknown>> | null) {
  const dynamicItems = (footerLinks ?? [])
    .map((item) => ({
      label: textFrom(item, ["label", "title", "type"]),
      value: textFrom(item, ["value", "text", "href", "url"]),
      href: textFrom(item, ["href", "url"]),
    }))
    .filter((item) => item.label && item.value);

  return dynamicItems.length
    ? dynamicItems
    : [
        { label: "Email", value: "support@biztrack.co", href: "mailto:support@biztrack.co" },
        { label: "Phone", value: "+255 700 000 000", href: "tel:+255700000000" },
        { label: "Location", value: "Dar es Salaam, Tanzania", href: "#" },
      ];
}

function navLinksFrom(defaults: NavLink[], links?: Array<Record<string, unknown>> | null): NavLink[] {
  const dynamic = (links ?? [])
    .map((item) => ({
      label: textFrom(item, ["label"]),
      href: textFrom(item, ["href"]),
    }))
    .filter((item) => item.label);
  return dynamic.length ? dynamic : defaults;
}

function contactIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("phone") || normalized.includes("call") || normalized.includes("whatsapp")) return Phone;
  if (normalized.includes("location") || normalized.includes("address")) return MapPin;
  return Mail;
}

export default function LandingFooter({ seoDescription, footerLinks, tagline, badge, productLinks, companyLinks }: Props) {
  const contactItems = contactItemsFrom(footerLinks);
  const productNavLinks = navLinksFrom(DEFAULT_PRODUCT_LINKS, productLinks);
  const companyNavLinks = navLinksFrom(DEFAULT_COMPANY_LINKS, companyLinks);
  const footerTaglineText = tagline || DEFAULT_TAGLINE;
  const footerBadgeText = badge || DEFAULT_BADGE;

  return (
    <footer id="contact" className="bg-[#111815] text-white/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main grid */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg bg-white/95 px-3 py-2">
              <BrandLogo className="h-auto w-40 max-w-full" variant="light" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/45">
              {footerTaglineText}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1.5 text-xs font-semibold text-leaf">
              {footerBadgeText}
            </span>
          </div>

          {/* Product links */}
          <nav aria-label="Product links">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Product
            </p>
            <ul className="flex flex-col gap-3">
              {productNavLinks.map(({ label, href }) => (
                <li key={label}>
                  {href.startsWith("#") ? (
                    <a
                      href={href}
                      className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      to={href}
                      className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Company links */}
          <nav aria-label="Company links">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Company
            </p>
            <ul className="flex flex-col gap-3">
              {companyNavLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Contact information">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Contact
            </p>
            <ul className="flex flex-col gap-3">
              {contactItems.map(({ label, value, href }) => {
                const Icon = contactIcon(label);
                const content = (
                  <>
                    <Icon size={15} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-white/30">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-white/65">{value}</span>
                    </span>
                  </>
                );

                return (
                  <li key={`${label}-${value}`}>
                    {href && href !== "#" ? (
                      <a href={href} className="flex gap-2.5 transition-colors hover:text-white">
                        {content}
                      </a>
                    ) : (
                      <div className="flex gap-2.5">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/8 py-6 sm:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} BizTrack. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-xs text-white/35 transition-colors hover:text-white/60"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs text-white/35 transition-colors hover:text-white/60"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
