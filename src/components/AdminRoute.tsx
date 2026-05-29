import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "SUPER_ADMIN") return <Navigate to="/403" replace />;

  return <Outlet />;
}
