import { Outlet, useLocation } from "react-router-dom";
import { useNoIndex } from "../../hooks/useSeo";
import { MotionPage } from "../animate-ui/MotionPrimitives";
import AdminMobileBottomNav from "./AdminMobileBottomNav";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout() {
  useNoIndex(false);
  const location = useLocation();

  return (
    <div className="spatial-shell min-h-screen text-ink">
      <AdminSidebar />
      <div className="min-h-screen lg:pl-64">
        <AdminTopbar />
        <main className="min-h-[calc(100vh-4rem)] pb-24 lg:pb-8">
          <MotionPage key={location.pathname}>
            <Outlet />
          </MotionPage>
        </main>
      </div>
      <AdminMobileBottomNav />
    </div>
  );
}
