import {
  User,
  MapPin,
  ClipboardList,
  Wallet as WalletIcon,
  FileText,
  Upload,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

const LINKS = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/addresses", label: "Addresses", icon: MapPin },
  { to: "/orders", label: "My Bookings", icon: ClipboardList },
  { to: "/wallet", label: "Wallet", icon: WalletIcon },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/prescriptions", label: "Prescriptions", icon: Upload },
];

/** Rendered by AppShell only for account-area routes on desktop widths — see
 *  ACCOUNT_ROUTE_PREFIXES in layouts/AppShell.tsx. */
function LeftRail() {
  const { logout } = useAuth();

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border px-3 py-6 md:flex">
      {LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
      <button
        onClick={logout}
        className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="size-5" />
        Logout
      </button>
    </aside>
  );
}

export { LeftRail };
