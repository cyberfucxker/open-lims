import {
  Database,
  FileText,
  FlaskConical,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Share2,
  TestTube,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: NavLeaf[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  {
    label: "Patient Management",
    icon: Users,
    children: [
      { label: "Patient Registration", path: "/admin/patients/register" },
      { label: "Patient Search", path: "/admin/patients/search" },
    ],
  },
  {
    label: "Billing",
    icon: Receipt,
    children: [{ label: "Bill List", path: "/admin/billing" }],
  },
  {
    label: "B2B / Organizations",
    icon: Handshake,
    children: [
      { label: "Organizations", path: "/admin/organizations" },
      { label: "Price Lists", path: "/admin/organizations/price-lists" },
    ],
  },
  {
    label: "Tests / Packages",
    icon: FlaskConical,
    children: [
      { label: "Test List", path: "/admin/tests" },
      { label: "Add Test", path: "/admin/tests/add" },
    ],
  },
  {
    label: "Master Management",
    icon: Database,
    children: [
      { label: "Centers", path: "/admin/masters/centers" },
      { label: "Departments", path: "/admin/masters/departments" },
      { label: "Categories", path: "/admin/masters/categories" },
      { label: "Sample Types", path: "/admin/masters/sample-types" },
      { label: "Containers", path: "/admin/samples/masters/containers" },
      { label: "Sample Rules", path: "/admin/samples/masters/rules" },
      { label: "Barcode Settings", path: "/admin/samples/masters/barcode" },
    ],
  },
  {
    label: "Sample Collection",
    icon: TestTube,
    children: [{ label: "Sample Order", path: "/admin/samples/orders" }],
  },
  {
    label: "Reports",
    icon: FileText,
    children: [
      { label: "Generate Reports", path: "/admin/reports/generate" },
      { label: "Report List", path: "/admin/reports" },
      { label: "Signatories", path: "/admin/reports/signatories" },
      { label: "Report Settings", path: "/admin/reports/settings" },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    children: [
      { label: "Finance Reports", path: "/admin/finance/reports" },
      { label: "Expenses", path: "/admin/finance/expenses" },
    ],
  },
  {
    label: "Marketing Staff",
    icon: Megaphone,
    children: [
      { label: "Monthly Report", path: "/admin/marketing-staff/monthly-report" },
      { label: "Marketing Staff", path: "/admin/marketing-staff/staff" },
      { label: "Referral Doctors", path: "/admin/marketing-staff/referral-doctors" },
      { label: "Targets & Incentives", path: "/admin/marketing-staff/targets-incentives" },
    ],
  },
  {
    label: "Referral Management",
    icon: Share2,
    children: [
      { label: "Referral", path: "/admin/referrals" },
      { label: "Referral Settlement", path: "/admin/referrals/settlements" },
      { label: "Referral Dashboard", path: "/admin/referrals/dashboard" },
      { label: "Referral Incentives", path: "/admin/referrals/incentives" },
    ],
  },
];
