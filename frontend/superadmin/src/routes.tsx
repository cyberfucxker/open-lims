import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { OrdersPage } from "@/pages/orders/OrdersPage";
import { CustomersPage } from "@/pages/customers/CustomersPage";
import { CustomerDetailPage } from "@/pages/customers/CustomerDetailPage";
import { TestsPackagesPage } from "@/pages/tests-packages/TestsPackagesPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { CmsPage } from "@/pages/cms/CmsPage";
import { SlotManagementPage } from "@/pages/slots/SlotManagementPage";
import { CitiesAreasPage } from "@/pages/cities-areas/CitiesAreasPage";
import { CentersPage } from "@/pages/centers/CentersPage";
import { PhlebosPage } from "@/pages/phlebos/PhlebosPage";
import { PhleboDetailPage } from "@/pages/phlebos/PhleboDetailPage";
import { OrganizationsPage } from "@/pages/organizations/OrganizationsPage";
import { PriceListsPage } from "@/pages/organizations/PriceListsPage";
import { PriceListPricingPage } from "@/pages/organizations/PriceListPricingPage";
import { PaymentsPage } from "@/pages/payments/PaymentsPage";
import { WalletPage } from "@/pages/wallet/WalletPage";
import { ReportsTrackerPage } from "@/pages/reports/ReportsTrackerPage";
import { ReviewsPage } from "@/pages/reviews/ReviewsPage";
import { PrescriptionsPage } from "@/pages/prescriptions/PrescriptionsPage";
import { BlogPostsPage } from "@/pages/blog/BlogPostsPage";
import { SupportPage } from "@/pages/support/SupportPage";
import { WhatsappPage } from "@/pages/whatsapp/WhatsappPage";
import { ExportsPage } from "@/pages/exports/ExportsPage";
import { AuditLogPage } from "@/pages/audit-log/AuditLogPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { FranchiseLayout } from "@/layouts/FranchiseLayout";
import { ChangePasswordPage } from "@/pages/account/ChangePasswordPage";
import { FranchiseDashboardPage } from "@/pages/franchise/FranchiseDashboardPage";
import { FranchiseOrdersPage } from "@/pages/franchise/FranchiseOrdersPage";
import { FranchisePhlebosPage } from "@/pages/franchise/FranchisePhlebosPage";
import { FranchisePriceListPage } from "@/pages/franchise/FranchisePriceListPage";
import { FranchiseProfilePage } from "@/pages/franchise/FranchiseProfilePage";
import { FranchiseReportsPage } from "@/pages/franchise/FranchiseReportsPage";
import { StaffPathGate } from "@/routes/StaffPathGate";

function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
            <StaffPathGate>
              <DashboardLayout />
            </StaffPathGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="tests-packages" element={<TestsPackagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="cms" element={<CmsPage />} />
        <Route path="slots" element={<SlotManagementPage />} />
        <Route path="cities-areas" element={<CitiesAreasPage />} />
        <Route path="centers" element={<CentersPage />} />
        <Route path="phlebos" element={<PhlebosPage />} />
        <Route path="phlebos/:id" element={<PhleboDetailPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="price-lists" element={<PriceListsPage />} />
        <Route path="price-lists/:id/pricing" element={<PriceListPricingPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="reports" element={<ReportsTrackerPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="blog" element={<BlogPostsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="whatsapp" element={<WhatsappPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Franchise portal — a separate tree behind its own role gate. A
          FRANCHISE user never renders the admin layout above, and an ADMIN
          never renders this one: these routes answer "my orders"/"my prices",
          which an admin session has no answer to. */}
      <Route
        path="franchise"
        element={
          <ProtectedRoute allowedRoles={["FRANCHISE"]}>
            <FranchiseLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FranchiseDashboardPage />} />
        <Route path="orders" element={<FranchiseOrdersPage />} />
        <Route path="phlebos" element={<FranchisePhlebosPage />} />
        <Route path="reports" element={<FranchiseReportsPage />} />
        <Route path="price-list" element={<FranchisePriceListPage />} />
        <Route path="profile" element={<FranchiseProfilePage />} />
        <Route
          path="change-password"
          element={
            <ChangePasswordPage description="Update the username and password for your franchise portal login." />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRoutes };
