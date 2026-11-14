import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CalendarClock,
  FileStack,
  FlaskConical,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  MapPin,
  MapPinned,
  MessageCircle,
  MessageSquareWarning,
  Newspaper,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Syringe,
  Tag,
  Users,
  Wallet,
  Wallet2,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "Orders", path: "/orders", icon: FileStack },
      { label: "Customers", path: "/customers", icon: Users },
      { label: "Slots", path: "/slots", icon: CalendarClock },
      { label: "Cities & Areas", path: "/cities-areas", icon: MapPinned },
      { label: "Diagnostic Centers", path: "/centers", icon: MapPin },
      { label: "Phlebotomists", path: "/phlebos", icon: Syringe },
    ],
  },
  {
    label: "Catalog",
    items: [{ label: "Tests & Packages", path: "/tests-packages", icon: FlaskConical }],
  },
  {
    label: "Engagement",
    items: [
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "CMS Pages", path: "/cms", icon: FileStack },
      { label: "Blog", path: "/blog", icon: Newspaper },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", path: "/payments", icon: Wallet },
      { label: "Wallet", path: "/wallet", icon: Wallet2 },
      { label: "Organizations", path: "/organizations", icon: Building2 },
      { label: "Price Lists", path: "/price-lists", icon: Tag },
    ],
  },
  {
    label: "Quality & Support",
    items: [
      { label: "Reports Tracker", path: "/reports", icon: Gauge },
      { label: "Reviews & Ratings", path: "/reviews", icon: Star },
      { label: "Prescriptions", path: "/prescriptions", icon: ScrollText },
      { label: "Support Tickets", path: "/support", icon: MessageSquareWarning },
      { label: "WhatsApp Assistant", path: "/whatsapp", icon: MessageCircle },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Export Center", path: "/exports", icon: History },
      { label: "Audit Log", path: "/audit-log", icon: ShieldCheck },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

/** The franchise portal's nav. Deliberately a separate list rather than a
 *  filtered view of `navGroups`: the two share no routes — every franchise
 *  route is scoped to the caller's own data and lives under /franchise. */
export const franchiseNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/franchise", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "Orders", path: "/franchise/orders", icon: FileStack },
      { label: "Phlebotomists", path: "/franchise/phlebos", icon: Syringe },
      { label: "Reports", path: "/franchise/reports", icon: Gauge },
    ],
  },
  {
    label: "Catalog",
    items: [{ label: "Price List", path: "/franchise/price-list", icon: Tag }],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", path: "/franchise/profile", icon: Building2 },
      { label: "Username & Password", path: "/franchise/change-password", icon: KeyRound },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
