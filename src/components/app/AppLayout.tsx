import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ADMIN_NAV_ITEMS } from "../../constants/adminNav";
import { ADMIN_BUTTON_NAV_ITEM, NAV_ITEMS } from "../../constants/nav";
import MobileBottomNav from "./MobileBottomNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminSection = location.pathname.startsWith("/admin");
  const navItems = useMemo(() => {
    if (isAdminSection) return ADMIN_NAV_ITEMS;
    if (user?.role === "SUPER_ADMIN") return [...NAV_ITEMS, ADMIN_BUTTON_NAV_ITEM];
    return NAV_ITEMS;
  }, [isAdminSection, user?.role]);

  return (
    <div className="flex min-h-screen bg-[#fbfaf6] text-ink">
      {/* Desktop sidebar — fixed left, visible on lg+ */}
      <Sidebar navItems={navItems} />

      {/* Main column: topbar + page content */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <Topbar isAdminSection={isAdminSection} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation — fixed bottom, hidden on lg+ */}
      <MobileBottomNav navItems={navItems} />
    </div>
  );
}
