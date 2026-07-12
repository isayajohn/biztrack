import { Link, useLocation } from "react-router-dom";
import { ADMIN_MOBILE_NAV_ITEMS, isAdminPathActive } from "../../constants/adminNav";

export default function AdminMobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white text-ink shadow-[0_-10px_30px_rgba(17,24,20,0.08)] lg:hidden"
      aria-label="Admin mobile navigation"
    >
      <ul className="flex overflow-x-auto" role="list">
        {ADMIN_MOBILE_NAV_ITEMS.map(({ label, to, icon: Icon, match, exact }) => {
          const isActive = isAdminPathActive(pathname, { to, match, exact });
          return (
            <li key={to} className="min-w-[74px] flex-1">
              <Link
                to={to}
                className={[
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 px-2 text-center text-[10px] font-bold leading-tight transition-colors",
                  isActive ? "bg-emerald-50 text-emerald-700" : "text-ink/45 hover:text-ink",
                ].join(" ")}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
