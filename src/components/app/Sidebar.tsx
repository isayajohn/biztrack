import { NavLink } from "react-router-dom";
import BrandLogo from "../BrandLogo";
import type { NavItem } from "../../constants/nav";

type Props = {
  navItems: NavItem[];
};

export default function Sidebar({ navItems }: Props) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink/10 bg-white lg:flex"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-ink/10 px-5">
        <BrandLogo className="h-auto w-36 max-w-full" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5" role="list">
          {navItems.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-mint text-leaf"
                      : "text-ink/65 hover:bg-[#f4f0e8] hover:text-ink",
                  ].join(" ")
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-ink/10 px-5 py-3">
        <p className="text-xs font-semibold text-ink/30">BizTrack v0.1</p>
      </div>
    </aside>
  );
}
