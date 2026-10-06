import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppAlertProvider from "./components/AppAlertProvider";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import { muiTheme } from "./theme";
import { LandingLanguageProvider } from "./i18n/LandingLanguageContext";
import "./styles.css";

const AppLayout = React.lazy(() => import("./components/app/AppLayout"));
const AdminLayout = React.lazy(() => import("./components/admin/AdminLayout"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const DemoDashboard = React.lazy(() => import("./pages/DemoDashboard"));
const ForbiddenPage = React.lazy(() => import("./pages/ForbiddenPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/PrivacyPolicyPage"));
const VerifyEmailPage = React.lazy(() => import("./pages/VerifyEmailPage"));
const VerifyAccountPage = React.lazy(() => import("./pages/VerifyAccountPage"));
const VerifyPhonePage = React.lazy(() => import("./pages/VerifyPhonePage"));
const ForgetPasswordPage = React.lazy(() => import("./pages/ForgetPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const SalesPage = React.lazy(() => import("./pages/SalesPage"));
const SaleFormPage = React.lazy(() => import("./pages/SaleFormPage"));
const SaleReceiptPage = React.lazy(() => import("./pages/SaleReceiptPage"));
const RecurringInvoicesPage = React.lazy(() => import("./pages/RecurringInvoicesPage"));
const RecurringInvoiceFormPage = React.lazy(() => import("./pages/RecurringInvoiceFormPage"));
const PosPage = React.lazy(() => import("./pages/PosPage"));
const ExpensesPage = React.lazy(() => import("./pages/ExpensesPage"));
const ExpenseFormPage = React.lazy(() => import("./pages/ExpenseFormPage"));
const ProductsPage = React.lazy(() => import("./pages/ProductsPage"));
const ProductFormPage = React.lazy(() => import("./pages/ProductFormPage"));
const ProductLabelPage = React.lazy(() => import("./pages/ProductLabelPage"));
const ReportsPage = React.lazy(() => import("./pages/ReportsPage"));
const CashFlowReportPage = React.lazy(() => import("./pages/CashFlowReportPage"));
const PurchaseReportPage = React.lazy(() => import("./pages/PurchaseReportPage"));
const SubscriptionPage = React.lazy(() => import("./pages/SubscriptionPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage"));
const CategoriesPage = React.lazy(() => import("./pages/CategoriesPage"));
const BrandsPage = React.lazy(() => import("./pages/BrandsPage"));
const PromotionsPage = React.lazy(() => import("./pages/PromotionsPage"));
const BranchesPage = React.lazy(() => import("./pages/BranchesPage"));
const StaffPage = React.lazy(() => import("./pages/StaffPage"));
const SuppliersPage = React.lazy(() => import("./pages/SuppliersPage"));
const CustomersPage = React.lazy(() => import("./pages/CustomersPage"));
const CustomerStatementPage = React.lazy(() => import("./pages/CustomerStatementPage"));
const PurchasesPage = React.lazy(() => import("./pages/PurchasesPage"));
const StockMovementsPage = React.lazy(() => import("./pages/StockMovementsPage"));
const StockAdjustmentsPage = React.lazy(() => import("./pages/StockAdjustmentsPage"));
const StockInPage = React.lazy(() => import("./pages/StockInPage"));
const DamagedStockPage = React.lazy(() => import("./pages/DamagedStockPage"));
const InventoryReportsPage = React.lazy(() => import("./pages/InventoryReportsPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));
const DebtsOverviewPage = React.lazy(() => import("./pages/DebtsOverviewPage"));
const CustomerDebtsPage = React.lazy(() => import("./pages/CustomerDebtsPage"));
const SupplierDebtsPage = React.lazy(() => import("./pages/SupplierDebtsPage"));
const DebtFormPage = React.lazy(() => import("./pages/DebtFormPage"));
const DebtDetailPage = React.lazy(() => import("./pages/DebtDetailPage"));
const DebtPaymentsPage = React.lazy(() => import("./pages/DebtPaymentsPage"));
const DebtRemindersPage = React.lazy(() => import("./pages/DebtRemindersPage"));
const DebtReportsPage = React.lazy(() => import("./pages/DebtReportsPage"));
const AdminAuditLogsPage = React.lazy(() => import("./pages/admin/AdminAuditLogsPage"));
const AdminBusinessDetailPage = React.lazy(() => import("./pages/admin/AdminBusinessDetailPage"));
const AdminBusinessesPage = React.lazy(() => import("./pages/admin/AdminBusinessesPage"));
const AdminCollectionsPage = React.lazy(() => import("./pages/admin/AdminCollectionsPage"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEmailConfigPage = React.lazy(() => import("./pages/admin/AdminEmailConfigPage"));
const AdminEmailProviderConfigPage = React.lazy(() => import("./pages/admin/AdminEmailProviderConfigPage"));
const AdminEmailTemplatesPage = React.lazy(() => import("./pages/admin/AdminEmailTemplatesPage"));
const AdminLandingPagePage = React.lazy(() => import("./pages/admin/AdminLandingPagePage"));
const AdminPackageFormPage = React.lazy(() => import("./pages/admin/AdminPackageFormPage"));
const AdminPackagesPage = React.lazy(() => import("./pages/admin/AdminPackagesPage"));
const AdminSecurityConfigPage = React.lazy(() => import("./pages/admin/AdminSecurityConfigPage"));
const AdminSettingsPage = React.lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminSmsConfigPage = React.lazy(() => import("./pages/admin/AdminSmsConfigPage"));
const AdminSmsProviderConfigPage = React.lazy(() => import("./pages/admin/AdminSmsProviderConfigPage"));
const AdminSmsTemplatesPage = React.lazy(() => import("./pages/admin/AdminSmsTemplatesPage"));
const AdminSubscriptionsPage = React.lazy(() => import("./pages/admin/AdminSubscriptionsPage"));
const AdminUserDetailPage = React.lazy(() => import("./pages/admin/AdminUserDetailPage"));
const AdminUsersPage = React.lazy(() => import("./pages/admin/AdminUsersPage"));

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

if ("serviceWorker" in navigator) {
  let refreshingForUpdate = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    void navigator.serviceWorker.getRegistration().then((registration) => registration?.update());
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider theme={muiTheme}>
        <BrowserRouter>
          <AppAlertProvider>
            <AuthProvider>
              <LandingLanguageProvider>
              <React.Suspense fallback={<div className="min-h-screen bg-[#080b17]" aria-label="Loading BizTrack" />}>
              <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/demo" element={<DemoDashboard />} />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/verify-account" element={<VerifyAccountPage />} />
<Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-phone" element={<VerifyPhonePage />} />
            <Route path="/forgot-password" element={<ForgetPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes — wrapped in AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<PosPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/new" element={<SaleFormPage />} />
                <Route path="/sales/:id/edit" element={<SaleFormPage />} />
                <Route path="/sales/:id/receipt" element={<SaleReceiptPage />} />
                <Route path="/sales/recurring" element={<RecurringInvoicesPage />} />
                <Route path="/sales/recurring/new" element={<RecurringInvoiceFormPage />} />
                <Route path="/sales/recurring/:id/edit" element={<RecurringInvoiceFormPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/expenses/new" element={<ExpenseFormPage />} />
                <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/products/:id/label" element={<ProductLabelPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/reports/cash-flow" element={<CashFlowReportPage />} />
                <Route path="/reports/purchases" element={<PurchaseReportPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Inventory module */}
                <Route path="/inventory/categories" element={<CategoriesPage />} />
                <Route path="/inventory/brands" element={<BrandsPage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/branches" element={<BranchesPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/inventory/suppliers" element={<SuppliersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id/statement" element={<CustomerStatementPage />} />
                <Route path="/inventory/purchases" element={<PurchasesPage />} />
                <Route path="/inventory/stock-in" element={<StockInPage />} />
                <Route path="/inventory/stock-movements" element={<StockMovementsPage />} />
                <Route path="/inventory/stock-adjustments" element={<StockAdjustmentsPage />} />
                <Route path="/inventory/damaged-stock" element={<DamagedStockPage />} />
                <Route path="/inventory/reports" element={<InventoryReportsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                {/* Debts & Credit module */}
                <Route path="/debts" element={<DebtsOverviewPage />} />
                <Route path="/debts/customers" element={<CustomerDebtsPage />} />
                <Route path="/debts/suppliers" element={<SupplierDebtsPage />} />
                <Route path="/debts/new" element={<DebtFormPage />} />
                <Route path="/debts/payments" element={<DebtPaymentsPage />} />
                <Route path="/debts/reminders" element={<DebtRemindersPage />} />
                <Route path="/debts/reports" element={<DebtReportsPage />} />
                <Route path="/debts/:id" element={<DebtDetailPage />} />
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
              </React.Suspense>
              </LandingLanguageProvider>
            </AuthProvider>
          </AppAlertProvider>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
