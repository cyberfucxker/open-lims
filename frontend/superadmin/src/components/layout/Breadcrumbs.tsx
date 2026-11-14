import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { allNavItems } from "@/config/navigation";

const DETAIL_LABELS: { pattern: RegExp; parentPath: string; label: string }[] = [
  { pattern: /^\/customers\/[^/]+$/, parentPath: "/customers", label: "Customer Profile" },
  { pattern: /^\/phlebos\/[^/]+$/, parentPath: "/phlebos", label: "Phlebotomist Profile" },
];

/** Pages reachable only from the account menu, not the sidebar. */
const MENU_ONLY_LABELS: Record<string, string> = {
  "/change-password": "Username & Password",
};

function resolveBreadcrumb(pathname: string): { label: string; path: string }[] {
  if (MENU_ONLY_LABELS[pathname]) return [{ label: MENU_ONLY_LABELS[pathname], path: pathname }];

  const exact = allNavItems.find((item) => item.path === pathname);
  if (exact) return [{ label: exact.label, path: exact.path }];

  const detail = DETAIL_LABELS.find((d) => d.pattern.test(pathname));
  if (detail) {
    const parent = allNavItems.find((item) => item.path === detail.parentPath);
    return [
      { label: parent?.label ?? "Home", path: detail.parentPath },
      { label: detail.label, path: pathname },
    ];
  }

  return [{ label: "Dashboard", path: "/" }];
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = resolveBreadcrumb(pathname);

  return (
    <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
      <Link to="/" className="flex items-center transition-colors hover:text-foreground">
        <Home className="size-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export { Breadcrumbs };
