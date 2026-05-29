import { LogOut, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import BrandLogo from "../BrandLogo";

type Props = {
  isAdminSection?: boolean;
};

export default function Topbar({ isAdminSection = false }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-ink/10 bg-white px-4 shadow-sm lg:px-6">
      {/* Brand — visible on mobile only (sidebar shows it on desktop) */}
      <div className="flex items-center gap-2 lg:hidden">
        <BrandLogo className="h-auto w-32 max-w-full" />
      </div>

      {/* Business + user name — desktop left side */}
      <div className="hidden lg:block">
        <p className="text-xs font-semibold leading-tight text-ink/50">
          {user?.businessName ?? "My Business"}
        </p>
        <p className="text-sm font-bold leading-tight text-ink">
          {user?.name ?? "User"} {user?.role === "SUPER_ADMIN" ? "· Super Admin" : ""}
        </p>
      </div>

      {/* Right side: user info (mobile) + logout */}
      <div className="ml-auto flex items-center gap-3 lg:ml-0">
        {user?.role === "SUPER_ADMIN" && !isAdminSection && (
          <Link
            to="/admin"
            className="hidden items-center gap-1.5 rounded-xl border border-leaf/20 bg-mint px-3 py-1.5 text-xs font-bold text-leaf transition-colors hover:bg-leaf hover:text-white sm:flex"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            Admin
          </Link>
        )}

        {/* Compact user info — mobile only */}
        <div className="flex flex-col items-end lg:hidden">
          <p className="text-xs font-bold leading-tight text-ink">
            {user?.name ?? "User"}
          </p>
          <p className="text-[10px] font-semibold leading-tight text-ink/50">
            {user?.businessName ?? "My Business"}
          </p>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-ink/15 bg-[#fbfaf6] px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-clay"
          aria-label="Log out"
        >
          <LogOut size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
