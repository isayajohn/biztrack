import { ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ADMIN_NAV_GROUPS } from "../../constants/adminNav";
import { AnimatedIcon } from "../animate-ui/MotionPrimitives";

export default function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/70 bg-white/58 shadow-[12px_0_44px_rgba(13,60,52,0.08)] backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-ink/10 bg-white/40 px-5">
        <img src="/biztrack-logo.png" alt="BizTrack" className="h-9 w-9 rounded-lg object-contain" />
        <div className="flex min-w-0 items-center gap-2">
          <p className="font-display text-lg font-bold text-ink">
            Biz<span className="text-orange-500">Track</span>
          </p>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-700">Admin</span>
        </div>
      </div>

      <div className="overflow-y-auto px-3 py-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-white/70 px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm">
          <AnimatedIcon icon={ShieldCheck} size={15} className="text-leaf" />
          Platform Management
        </div>
        <nav aria-label="Admin navigation">
          <div className="space-y-5">
            {ADMIN_NAV_GROUPS.map((group) => (
              <section key={group.label} aria-labelledby={`admin-nav-${group.label.replace(/\W+/g, "-").toLowerCase()}`}>
                <h2
                  id={`admin-nav-${group.label.replace(/\W+/g, "-").toLowerCase()}`}
                  className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink/35"
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
                              ? "bg-white/80 text-emerald-700 ring-1 ring-emerald-200 shadow-sm"
                              : "text-ink/65 hover:bg-white/58 hover:text-ink",
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

    </aside>
  );
}
