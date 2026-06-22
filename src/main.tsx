import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppSnackbarProvider from "./components/AppSnackbarProvider";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AppLayout from "./components/app/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DemoDashboard from "./pages/DemoDashboard";
import ForbiddenPage from "./pages/ForbiddenPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import SalesPage from "./pages/SalesPage";
import SaleFormPage from "./pages/SaleFormPage";
import ExpensesPage from "./pages/ExpensesPage";
import ExpenseFormPage from "./pages/ExpenseFormPage";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
import ReportsPage from "./pages/ReportsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import CategoriesPage from "./pages/CategoriesPage";
import SuppliersPage from "./pages/SuppliersPage";
import PurchasesPage from "./pages/PurchasesPage";
import StockMovementsPage from "./pages/StockMovementsPage";
import StockInPage from "./pages/StockInPage";
import DamagedStockPage from "./pages/DamagedStockPage";
import InventoryReportsPage from "./pages/InventoryReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminBusinessDetailPage from "./pages/admin/AdminBusinessDetailPage";
import AdminBusinessesPage from "./pages/admin/AdminBusinessesPage";
import AdminCollectionsPage from "./pages/admin/AdminCollectionsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmailConfigPage from "./pages/admin/AdminEmailConfigPage";
import AdminEmailProviderConfigPage from "./pages/admin/AdminEmailProviderConfigPage";
import AdminEmailTemplatesPage from "./pages/admin/AdminEmailTemplatesPage";
import AdminLandingPagePage from "./pages/admin/AdminLandingPagePage";
import AdminPackageFormPage from "./pages/admin/AdminPackageFormPage";
import AdminPackagesPage from "./pages/admin/AdminPackagesPage";
import AdminSecurityConfigPage from "./pages/admin/AdminSecurityConfigPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminSmsConfigPage from "./pages/admin/AdminSmsConfigPage";
import AdminSmsProviderConfigPage from "./pages/admin/AdminSmsProviderConfigPage";
import AdminSmsTemplatesPage from "./pages/admin/AdminSmsTemplatesPage";
import AdminSubscriptionsPage from "./pages/admin/AdminSubscriptionsPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import { muiTheme } from "./theme";
import "./styles.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider theme={muiTheme}>
        <BrowserRouter>
          <AppSnackbarProvider>
            <AuthProvider>
              <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<DemoDashboard />} />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
<Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgetPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes — wrapped in AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/new" element={<SaleFormPage />} />
                <Route path="/sales/:id/edit" element={<SaleFormPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/expenses/new" element={<ExpenseFormPage />} />
                <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Inventory module */}
                <Route path="/inventory/categories" element={<CategoriesPage />} />
                <Route path="/inventory/suppliers" element={<SuppliersPage />} />
                <Route path="/inventory/purchases" element={<PurchasesPage />} />
                <Route path="/inventory/stock-in" element={<StockInPage />} />
                <Route path="/inventory/stock-movements" element={<StockMovementsPage />} />
                <Route path="/inventory/damaged-stock" element={<DamagedStockPage />} />
                <Route path="/inventory/reports" element={<InventoryReportsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
                <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
                <Route path="/admin/businesses/:businessId/subscription" element={<AdminSubscriptionsPage />} />
                <Route path="/admin/businesses/:id" element={<AdminBusinessDetailPage />} />
                <Route path="/admin/packages" element={<AdminPackagesPage />} />
                <Route path="/admin/packages/new" element={<AdminPackageFormPage />} />
                <Route path="/admin/packages/:id/edit" element={<AdminPackageFormPage />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="/admin/collections" element={<AdminCollectionsPage />} />
                <Route path="/admin/landing-page" element={<AdminLandingPagePage />} />
                <Route path="/admin/email" element={<AdminEmailConfigPage />} />
                <Route path="/admin/security" element={<AdminSecurityConfigPage />} />
                <Route path="/admin/sms" element={<AdminSmsConfigPage />} />
                <Route path="/admin/config/email" element={<AdminEmailProviderConfigPage />} />
                <Route path="/admin/config/security" element={<AdminSecurityConfigPage />} />
                <Route path="/admin/config/sms" element={<AdminSmsProviderConfigPage />} />
                <Route path="/admin/templates/email" element={<AdminEmailTemplatesPage />} />
                <Route path="/admin/templates/sms" element={<AdminSmsTemplatesPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>
              </Routes>
            </AuthProvider>
          </AppSnackbarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
