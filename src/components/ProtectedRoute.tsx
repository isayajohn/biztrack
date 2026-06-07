import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLoadingScreen from "./AuthLoadingScreen";

/**
 * Wraps protected routes. Unauthenticated users are redirected to /login.
 * Usage in router: <Route element={<ProtectedRoute />}>  <Route path="/dashboard" ... /> </Route>
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (
    user?.role !== "SUPER_ADMIN" &&
    !user?.businessId &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
