import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-ink/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-white shadow-sm">
            <BarChart3 size={18} aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            BizTrack
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-semibold text-ink/65 transition-colors hover:text-leaf"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-ink/70 transition-colors hover:text-leaf"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-leaf/90 hover:shadow-md"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 bg-white shadow-sm md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-ink/10 bg-white px-4 pb-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-0.5 pt-3" aria-label="Mobile navigation">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-ink/75 transition-colors hover:bg-mint hover:text-leaf"
                onClick={() => setIsOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-ink/10 pt-4">
            <Link
              to="/login"
              className="rounded-xl border border-ink/15 px-3 py-2.5 text-center text-sm font-semibold text-ink transition-colors hover:bg-[#fbfaf6]"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-leaf px-3 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-leaf/90"
              onClick={() => setIsOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
