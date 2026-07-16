import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function initials(name?: string) {
  const parts = (name ?? "Admin").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
}

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleLabel = user?.role === "SUPER_ADMIN" ? "Super Admin" : (user?.role ?? "Admin");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/62 px-4 shadow-[0_12px_36px_rgba(13,60,52,0.07)] backdrop-blur-xl lg:px-6">
      <div className="flex h-14 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 lg:hidden">
              <ShieldCheck size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-ink">
                BizTrack Admin
              </p>
              <p className="truncate text-xs font-semibold text-ink/45">
                Platform management
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2 rounded-full px-1.5 pr-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-xs font-bold text-ink/65">
              {initials(user?.name)}
            </span>
            <span className="hidden text-sm font-bold text-ink sm:inline">{roleLabel}</span>
            <ChevronDown size={16} className="hidden text-ink/45 sm:block" aria-hidden="true" />
          </div>
          <button
            onClick={handleLogout}
            className="grid h-10 w-10 place-items-center rounded-full text-ink/45 transition-colors hover:bg-red-50 hover:text-clay"
            aria-label="Log out"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
