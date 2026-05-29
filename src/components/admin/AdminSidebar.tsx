import { ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ADMIN_NAV_GROUPS } from "../../constants/adminNav";
import { AnimatedIcon } from "../animate-ui/MotionPrimitives";
import BrandLogo from "../BrandLogo";

export default function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink/10 bg-[#111814] text-white lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <BrandLogo className="h-auto w-36 max-w-full" variant="dark" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/45">SUPER_ADMIN console</p>
        </div>
      </div>

      <div className="overflow-y-auto px-3 py-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/70">
          <AnimatedIcon icon={ShieldCheck} size={15} className="text-leaf" />
          Platform Management
        </div>
        <nav aria-label="Admin navigation">
          <div className="space-y-5">
            {ADMIN_NAV_GROUPS.map((group) => (
              <section key={group.label} aria-labelledby={`admin-nav-${group.label.replace(/\W+/g, "-").toLowerCase()}`}>
                <h2
                  id={`admin-nav-${group.label.replace(/\W+/g, "-").toLowerCase()}`}
                  className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/35"
                >
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-1" role="list">
                  {group.items.map(({ label, to, icon: Icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === "/admin"}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                            isActive
                              ? "bg-white text-[#111814]"
                              : "text-white/62 hover:bg-white/[0.08] hover:text-white",
                          ].join(" ")
                        }
                      >
                        <AnimatedIcon icon={Icon} size={18} />
                        <span className="truncate">{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 px-5 py-4">
        <p className="text-xs font-semibold text-white/35">Admin controls are enforced by the API.</p>
      </div>
    </aside>
  );
}
