import { ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ADMIN_NAV_GROUPS } from "../../constants/adminNav";
import { AnimatedIcon } from "../animate-ui/MotionPrimitives";

export default function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#dadad3] bg-white lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e5e5e0] bg-white px-5">
        <img src="/biztrack-logo.png" alt="BizTrack" className="h-9 w-9 rounded-2xl object-contain" />
        <div className="flex min-w-0 items-center gap-2">
          <p className="font-display text-lg font-bold text-ink">
            Biz<span className="text-orange-500">Track</span>
          </p>
          <span className="rounded-full bg-[#f6f6f3] px-2.5 py-1 text-[11px] font-extrabold text-[#e60023]">Admin</span>
        </div>
      </div>

      <div className="overflow-y-auto px-3 py-4">
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[#f6f6f3] px-3 py-2.5 text-xs font-bold text-[#211922]">
          <AnimatedIcon icon={ShieldCheck} size={15} className="text-[#e60023]" />
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
                            "flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
                            isActive
                              ? "bg-[#f6f6f3] text-[#e60023]"
                              : "text-[#62625b] hover:bg-[#f6f6f3] hover:text-black",
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
