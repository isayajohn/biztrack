import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ADMIN_NAV_ITEMS } from "../../constants/adminNav";
import { ADMIN_BUTTON_NAV_ITEM, NAV_ITEMS } from "../../constants/nav";
import { useNoIndex } from "../../hooks/useSeo";
import { MotionPage } from "../animate-ui/MotionPrimitives";
import { Sheet, SheetContent } from "../ui/sheet";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  useNoIndex(false);
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isAdminSection = location.pathname.startsWith("/admin");

  useEffect(() => {
    document.body.classList.add("portal-active");
    return () => document.body.classList.remove("portal-active");
  }, []);

  const navItems = useMemo(() => {
    if (isAdminSection) return ADMIN_NAV_ITEMS;
    if (user?.role === "SUPER_ADMIN") return [...NAV_ITEMS, ADMIN_BUTTON_NAV_ITEM];
    const permissions = user?.permissions ?? [];
    return NAV_ITEMS.filter((item) => !item.permission || permissions.includes("*") || permissions.includes(item.permission));
  }, [isAdminSection, user?.role, user?.permissions]);

  return (
    <div className="portal-shell spatial-shell flex min-h-screen text-ink">
      {/* Desktop sidebar — fixed left, visible on lg+ */}
      <Sidebar
        navItems={navItems}
        collapsed={sidebarCollapsed}
      />

      {/* Main column: topbar + page content */}
      <div className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <Topbar
          isAdminSection={isAdminSection}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <main className="portal-content flex-1 overflow-y-auto">
          <MotionPage key={location.pathname}>
            <Outlet />
          </MotionPage>
        </main>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent>
          <Sidebar navItems={navItems} variant="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
