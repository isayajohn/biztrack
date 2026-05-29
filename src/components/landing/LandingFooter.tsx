import { Link } from "react-router-dom";
import BrandLogo from "../BrandLogo";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "View Demo", href: "/demo" },
];

const COMPANY_LINKS = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
];

type Props = {
  seoDescription?: string | null;
};

export default function LandingFooter({ seoDescription }: Props) {
  return (
    <footer className="bg-[#111815] text-white/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main grid */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BrandLogo className="h-auto w-44 max-w-full" variant="dark" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/45">
              {seoDescription ||
                "Simple sales and expense tracking for small businesses. Know your numbers, grow your business."}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1.5 text-xs font-semibold text-leaf">
              Free to get started
            </span>
          </div>

          {/* Product links */}
          <nav aria-label="Product links">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Product
            </p>
            <ul className="flex flex-col gap-3">
              {PRODUCT_LINKS.map(({ label, href }) => (
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
              {COMPANY_LINKS.map(({ label, href }) => (
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
