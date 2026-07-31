import { NavLink } from "react-router-dom";
import type { NavItem } from "../../constants/nav";

type Props = {
  navItems: NavItem[];
};

export default function MobileBottomNav({ navItems }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white lg:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="flex" role="list">
        {navItems.map(({ label, to, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                  isActive ? "text-leaf" : "text-ink/45",
                ].join(" ")
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
