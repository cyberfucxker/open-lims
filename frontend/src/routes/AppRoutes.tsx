import { Navigate, Route, Routes } from "react-router-dom";

import { AdminPanelLayout } from "@/layouts/AdminPanelLayout";
import { PortalLayout } from "@/layouts/PortalLayout";
import { LoginPage } from "@/pages/LoginPage";
import { BillListPage } from "@/pages/admin/billing/BillListPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { ExpensesPage } from "@/pages/admin/finance/ExpensesPage";
import { FinanceReportsPage } from "@/pages/admin/finance/FinanceReportsPage";
import { CategoriesPage } from "@/pages/admin/masters/CategoriesPage";
import { CentersPage } from "@/pages/admin/masters/CentersPage";
import { DepartmentsPage } from "@/pages/admin/masters/DepartmentsPage";
import { SampleTypesPage } from "@/pages/admin/masters/SampleTypesPage";
import { OrganizationFormPage } from "@/pages/admin/organizations/OrganizationFormPage";
import { OrganizationsPage } from "@/pages/admin/organizations/OrganizationsPage";
import { PriceListsPage } from "@/pages/admin/organizations/PriceListsPage";
import { MarketingStaffPage } from "@/pages/admin/marketingStaff/MarketingStaffPage";
import { MonthlyReportPage } from "@/pages/admin/marketingStaff/MonthlyReportPage";
import { ReferralDoctorsPage } from "@/pages/admin/marketingStaff/ReferralDoctorsPage";
import { TargetsIncentivesPage } from "@/pages/admin/marketingStaff/TargetsIncentivesPage";
import { PatientRegistrationPage } from "@/pages/admin/patients/PatientRegistrationPage";
import { ReferralDashboardPage } from "@/pages/admin/referrals/ReferralDashboardPage";
import { ReferralIncentivesPage } from "@/pages/admin/referrals/ReferralIncentivesPage";
import { ReferralSettlementsPage } from "@/pages/admin/referrals/ReferralSettlementsPage";
import { ReferralsPage } from "@/pages/admin/referrals/ReferralsPage";
import { PatientSearchPage } from "@/pages/admin/patients/PatientSearchPage";
import { GenerateReportsPage } from "@/pages/admin/reports/GenerateReportsPage";
import { ReportEntryPage } from "@/pages/admin/reports/ReportEntryPage";
import { ReportListPage } from "@/pages/admin/reports/ReportListPage";
import { ReportSettingsPage } from "@/pages/admin/reports/ReportSettingsPage";
import { SignatoriesPage } from "@/pages/admin/reports/SignatoriesPage";
import { TestReportEntryPage } from "@/pages/admin/reports/TestReportEntryPage";
import { BarcodeSettingsPage } from "@/pages/admin/samples/masters/BarcodeSettingsPage";
import { ContainersPage } from "@/pages/admin/samples/masters/ContainersPage";
import { SampleRulesPage } from "@/pages/admin/samples/masters/SampleRulesPage";
import { SampleOrderPage } from "@/pages/admin/samples/SampleOrderPage";
import { AddTestPage } from "@/pages/admin/tests/AddTestPage";
import { TestListPage } from "@/pages/admin/tests/TestListPage";
import { PortalDashboardPage } from "@/pages/portal/PortalDashboardPage";
import { PortalInvoicesPage } from "@/pages/portal/PortalInvoicesPage";
import { PortalPatientListPage } from "@/pages/portal/PortalPatientListPage";
import { PortalPatientRegistrationPage } from "@/pages/portal/PortalPatientRegistrationPage";
import { PortalReportsPage } from "@/pages/portal/PortalReportsPage";
import { PortalSampleCollectionPage } from "@/pages/portal/PortalSampleCollectionPage";
import { GuestRoute } from "./GuestRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { RootRedirect } from "./RootRedirect";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminPanelLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/billing" element={<BillListPage />} />
        <Route path="/admin/patients/register" element={<PatientRegistrationPage />} />
        <Route path="/admin/patients/search" element={<PatientSearchPage />} />
        <Route path="/admin/tests" element={<TestListPage />} />
        <Route path="/admin/tests/add" element={<AddTestPage />} />
        <Route path="/admin/masters/centers" element={<CentersPage />} />
        <Route path="/admin/masters/departments" element={<DepartmentsPage />} />
        <Route path="/admin/masters/categories" element={<CategoriesPage />} />
        <Route path="/admin/masters/sample-types" element={<SampleTypesPage />} />
        <Route path="/admin/samples/masters/containers" element={<ContainersPage />} />
        <Route path="/admin/samples/masters/rules" element={<SampleRulesPage />} />
        <Route path="/admin/samples/masters/barcode" element={<BarcodeSettingsPage />} />
        <Route path="/admin/samples/orders" element={<SampleOrderPage />} />
        <Route path="/admin/reports" element={<ReportListPage />} />
        <Route path="/admin/reports/generate" element={<GenerateReportsPage />} />
        <Route path="/admin/reports/settings" element={<ReportSettingsPage />} />
        <Route path="/admin/reports/signatories" element={<SignatoriesPage />} />
        <Route path="/admin/reports/:id/entry" element={<ReportEntryPage />} />
        <Route path="/admin/reports/:id/test/:resultId" element={<TestReportEntryPage />} />
        <Route path="/admin/organizations" element={<OrganizationsPage />} />
        <Route path="/admin/organizations/add" element={<OrganizationFormPage />} />
        <Route path="/admin/organizations/:id/edit" element={<OrganizationFormPage />} />
        <Route path="/admin/organizations/price-lists" element={<PriceListsPage />} />
        <Route path="/admin/marketing-staff/staff" element={<MarketingStaffPage />} />
        <Route path="/admin/marketing-staff/monthly-report" element={<MonthlyReportPage />} />
        <Route path="/admin/marketing-staff/referral-doctors" element={<ReferralDoctorsPage />} />
        <Route
          path="/admin/marketing-staff/targets-incentives"
          element={<TargetsIncentivesPage />}
        />
        <Route path="/admin/referrals" element={<ReferralsPage />} />
        <Route path="/admin/referrals/settlements" element={<ReferralSettlementsPage />} />
        <Route path="/admin/referrals/dashboard" element={<ReferralDashboardPage />} />
        <Route path="/admin/referrals/incentives" element={<ReferralIncentivesPage />} />
        <Route path="/admin/finance/reports" element={<FinanceReportsPage />} />
        <Route path="/admin/finance/expenses" element={<ExpensesPage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute allowedRoles={["FRANCHISE"]}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
        <Route path="/portal/patients/register" element={<PortalPatientRegistrationPage />} />
        <Route path="/portal/patients" element={<PortalPatientListPage />} />
        <Route path="/portal/samples" element={<PortalSampleCollectionPage />} />
        <Route path="/portal/reports" element={<PortalReportsPage />} />
        <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRoutes };
