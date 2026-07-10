  import { LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 px-4 shadow-sm backdrop-blur lg:px-6">
      <div className="flex h-16 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#111814] text-white lg:hidden">
              <ShieldCheck size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-extrabold text-ink sm:text-lg">
                BizTrack Admin
              </p>
              <p className="truncate text-xs font-semibold text-ink/45">
                {user?.name ?? "Admin"} · {user?.role ?? "SUPER_ADMIN"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-[#f7faf9] px-3 py-2 text-xs font-bold text-ink/65 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-clay"
            aria-label="Log out"
          >
            <LogOut size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
