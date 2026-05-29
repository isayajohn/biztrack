import { Outlet } from "react-router-dom";
import AdminMobileBottomNav from "./AdminMobileBottomNav";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f5f7f4] text-ink">
      <AdminSidebar />
      <div className="min-h-screen lg:pl-64">
        <AdminTopbar />
        <main className="min-h-[calc(100vh-4rem)] pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <AdminMobileBottomNav />
    </div>
  );
}
