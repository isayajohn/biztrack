import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import BrandLogo from "../BrandLogo";
import { PrimaryButton, SecondaryButton } from "./LandingDesignSystem";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const mobileMenuId = "landing-mobile-menu";

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={[
        "sticky inset-x-0 top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-white/85 backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink"
          onClick={closeMenu}
          aria-label="BizTrack home"
        >
          <BrandLogo className="h-auto w-36 max-w-[150px]" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-semibold text-slateMuted transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm font-semibold text-slateMuted transition-colors hover:text-ink">
            Login
          </Link>
          <PrimaryButton to="/register" className="min-h-10 px-4 py-2">
            Get Started
          </PrimaryButton>
        </div>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slateMuted shadow-sm transition-colors hover:bg-cloud hover:text-ink focus:outline-none focus:ring-4 focus:ring-leaf/15 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-controls={mobileMenuId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <span className="grid transition-transform duration-200" aria-hidden="true">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </span>
        </button>
      </div>

      <div
        id={mobileMenuId}
        aria-hidden={!menuOpen}
        className={[
          "overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 ease-out md:hidden",
          menuOpen
            ? "max-h-96 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <div className="px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slateMuted transition-colors hover:bg-cloud hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3">
            <SecondaryButton
              to="/login"
              onClick={closeMenu}
              className="w-full"
            >
              Login
            </SecondaryButton>
            <PrimaryButton
              to="/register"
              onClick={closeMenu}
              className="w-full"
            >
              Get Started
            </PrimaryButton>
          </div>
        </div>
      </div>
    </header>
  );
}
