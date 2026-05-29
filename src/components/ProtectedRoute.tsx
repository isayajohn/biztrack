import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLoadingScreen from "./AuthLoadingScreen";

/**
 * Wraps protected routes. Unauthenticated users are redirected to /login.
 * Usage in router: <Route element={<ProtectedRoute />}>  <Route path="/dashboard" ... /> </Route>
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
