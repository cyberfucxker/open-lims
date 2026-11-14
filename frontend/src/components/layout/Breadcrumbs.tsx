import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { NAV_ITEMS } from "@/config/navigation";

function resolveBreadcrumb(pathname: string): { label: string; path: string }[] {
  for (const item of NAV_ITEMS) {
    if (item.path === pathname) {
      return [{ label: item.label, path: item.path }];
    }
    if (item.children) {
      const child = item.children.find((c) => c.path === pathname);
      if (child) {
        return [
          { label: item.label, path: item.children[0].path },
          { label: child.label, path: child.path },
        ];
      }
    }
  }
  // Report Entry is a dynamic child route (/admin/reports/:id/entry) reached
  // only via a link from the Report List, so it has no NAV_ITEMS entry of
  // its own to exact-match above.
  if (/^\/admin\/reports\/[^/]+\/entry$/.test(pathname)) {
    return [
      { label: "Reports", path: "/admin/reports" },
      { label: "Report Entry", path: pathname },
    ];
  }
  return [{ label: "Dashboard", path: "/admin/dashboard" }];
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = resolveBreadcrumb(pathname);

  return (
    <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
      <Link
        to="/admin/dashboard"
        className="flex items-center transition-colors hover:text-foreground"
      >
        <Home className="size-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        // Index, not crumb.path: the parent crumb links to its group's first
        // child page, so on that exact page both crumbs share the same path.
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
