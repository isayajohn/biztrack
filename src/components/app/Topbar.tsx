import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, CreditCard, LogOut, Menu, Settings, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import BrandLogo from "../BrandLogo";
import { getBranches } from "../../services/organizationApi";
import type { Branch } from "../../services/organizationApi";
import { ACTIVE_BRANCH_KEY } from "../../services/apiClient";
import { getNotifications, getUnreadCount } from "../../services/inventoryApi";
import type { InventoryNotification } from "../../services/inventoryApi";

type Props = {
  isAdminSection?: boolean;
  onOpenSidebar?: () => void;
  onToggleSidebar?: () => void;
};

function initials(name?: string) {
  const parts = (name ?? "User").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export default function Topbar({ isAdminSection = false, onOpenSidebar, onToggleSidebar }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState(() => localStorage.getItem(ACTIVE_BRANCH_KEY) ?? user?.branch?.id ?? "");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<InventoryNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user?.businessRole === "OWNER" || user?.businessRole === "MANAGER") getBranches().then((items) => { setBranches(items.filter((branch) => branch.isActive)); if (!activeBranch) { const selected = items.find((branch) => branch.isDefault)?.id ?? ""; if (selected) { setActiveBranch(selected); localStorage.setItem(ACTIVE_BRANCH_KEY, selected); } } }).catch(() => undefined); }, [user?.businessRole]);

  useEffect(() => {
    Promise.all([getUnreadCount(), getNotifications(true)])
      .then(([count, notifications]) => {
        setUnreadNotifications(count);
        setRecentNotifications(notifications.slice(0, 4));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/70 bg-white/62 px-4 shadow-[0_12px_36px_rgba(13,60,52,0.07)] backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (window.matchMedia("(min-width: 1024px)").matches) {
              onToggleSidebar?.();
            } else {
              onOpenSidebar?.();
            }
          }}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink/70 transition-colors hover:bg-white/70 hover:text-ink"
          aria-label="Open sidebar"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <BrandLogo className="h-auto w-32 max-w-full lg:hidden" />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {branches.length > 1 && <select value={activeBranch} onChange={(event) => { setActiveBranch(event.target.value); localStorage.setItem(ACTIVE_BRANCH_KEY, event.target.value); window.location.reload(); }} className="minimal-input hidden h-10 rounded-lg px-3 text-xs font-bold text-ink/70 sm:block">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>}
        {user?.role === "SUPER_ADMIN" && !isAdminSection && (
          <Link
            to="/admin"
            className="hidden h-10 items-center gap-1.5 rounded-lg border border-leaf/20 bg-mint px-3 text-xs font-bold text-leaf transition-colors hover:bg-leaf hover:text-white sm:flex"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            Admin
          </Link>
        )}

        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-white/70 hover:text-ink"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={18} aria-hidden="true" />
            {unreadNotifications > 0 && <span className="absolute right-1.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold leading-none text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
          </button>
          {notificationsOpen && (
            <div className="glass-panel absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl">
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                <div>
                  <p className="font-display text-sm font-bold text-ink">Notifications</p>
                  <p className="text-xs font-semibold text-ink/45">{unreadNotifications} unread</p>
                </div>
                <Link to="/notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">View all</Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm font-semibold text-ink/45">No unread notifications.</p>
                ) : recentNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="block border-b border-ink/8 px-4 py-3 last:border-0 hover:bg-emerald-50/70"
                  >
                    <p className="text-sm font-bold text-ink">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-ink/50">{notification.message}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}
            className="flex h-10 items-center gap-2 rounded-full px-1.5 pr-2 transition-colors hover:bg-white/70"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-xs font-bold text-ink/65">{initials(user?.name)}</span>
            <span className="hidden text-sm font-bold text-ink sm:inline">{user?.name ?? "User"}</span>
            <ChevronDown size={16} className="hidden text-ink/45 sm:block" aria-hidden="true" />
          </button>
          {profileOpen && (
            <div className="glass-panel absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-xl">
              <div className="border-b border-ink/10 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-sm font-extrabold text-emerald-700">{initials(user?.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-ink">{user?.name ?? "User"}</p>
                    <p className="truncate text-xs font-semibold text-ink/45">{user?.businessName ?? "My Business"}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {user?.role === "SUPER_ADMIN" && !isAdminSection && (
                  <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/70 hover:bg-emerald-50 hover:text-ink">
                    <ShieldCheck size={16} />
                    Admin
                  </Link>
                )}
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/70 hover:bg-emerald-50 hover:text-ink">
                  <Settings size={16} />
                  Settings
                </Link>
                <Link to="/subscription" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/70 hover:bg-emerald-50 hover:text-ink">
                  <CreditCard size={16} />
                  Billing
                </Link>
                <div className="my-2 border-t border-ink/10" />
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-clay hover:bg-red-50">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
