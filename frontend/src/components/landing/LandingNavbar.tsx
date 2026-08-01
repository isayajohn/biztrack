import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Product", href: "/#product-tour" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Why BizTrack", href: "/#why-biztrack" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
];

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || menuOpen ? "border-b border-white/[0.08] bg-[#070908]/90 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" onClick={() => setMenuOpen(false)} aria-label="BizTrack home">
          <img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="h-auto w-36 sm:w-40" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="text-sm font-semibold text-white/50 transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="px-3 py-2 text-sm font-semibold text-white/60 hover:text-white">Log in</Link>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#12e4d7] px-5 py-2.5 text-sm font-bold text-[#051210] shadow-[0_0_30px_rgba(18,228,215,0.14)] hover:-translate-y-0.5 hover:bg-white">
            Start free <ArrowUpRight size={15} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white lg:hidden"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      <div className={`overflow-hidden border-t border-white/[0.08] bg-[#070908] transition-all duration-300 lg:hidden ${menuOpen ? "max-h-[520px] opacity-100" : "max-h-0 border-transparent opacity-0"}`}>
        <nav className="mx-auto flex max-w-7xl flex-col px-5 py-5 sm:px-8" aria-label="Mobile navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} className="border-b border-white/[0.06] py-3.5 text-sm font-semibold text-white/[0.65] last:border-0">
              {label}
            </a>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-full border border-white/10 px-4 py-3 text-center text-sm font-bold text-white">Log in</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-full bg-[#12e4d7] px-4 py-3 text-center text-sm font-bold text-[#051210]">Start free</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
