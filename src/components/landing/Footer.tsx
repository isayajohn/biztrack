import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "View Demo", href: "/demo" },
];

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#111815] text-white/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main footer content */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-white">
                <BarChart3 size={18} aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-bold text-white">BizTrack</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/45">
              Simple sales and expense tracking for small businesses. Know your numbers, grow your business.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1.5 text-xs font-semibold text-leaf">
              Free to get started
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Product</p>
            <ul className="flex flex-col gap-3">
              {productLinks.map(({ label, href }) => (
                <li key={label}>
                  {href.startsWith("#") || href.startsWith("/") ? (
                    href.startsWith("#") ? (
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
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Company</p>
            <ul className="flex flex-col gap-3">
              {companyLinks.map(({ label, href }) => (
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
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/8 py-6 sm:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} BizTrack. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs text-white/35 hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-white/35 hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
