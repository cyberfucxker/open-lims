import { useMemo } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";

import { navGroups, type NavGroup } from "@/config/navigation";
import { cn } from "@/utils/cn";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Which nav to render. Defaults to the admin nav so existing call sites are
   *  unchanged; the franchise portal passes its own. */
  groups?: NavGroup[];
}

/** Does `pathname` sit under `navPath`? Exact match, or a `/`-delimited child —
 *  so "/reports" never matches "/reports-tracker". */
function matches(pathname: string, navPath: string): boolean {
  return pathname === navPath || pathname.startsWith(`${navPath}/`);
}

/**
 * Exactly one nav item is active: the one whose path is the LONGEST match for
 * the current URL.
 *
 * A plain `startsWith` marks every ancestor active too, which breaks in two
 * ways at once. Two items rendering the shared `layoutId` pill means only one
 * actually gets it, so the other is left with active-coloured text and no
 * background behind it — white on white, invisible. The franchise portal hits
 * this on every page, since its index route "/franchise" is a prefix of every
 * other route in that tree.
 *
 * Longest-match also subsumes the special case the admin nav previously needed
 * for "/", which otherwise prefixes literally everything.
 */
function useActivePath(groups: NavGroup[], pathname: string): string | null {
  return useMemo(() => {
    let best: string | null = null;
    for (const group of groups) {
      for (const item of group.items) {
        if (!matches(pathname, item.path)) continue;
        if (best === null || item.path.length > best.length) best = item.path;
      }
    }
    return best;
  }, [groups, pathname]);
}

/**
 * Paths that are a parent of another nav entry — "/" in the admin nav,
 * "/franchise" in the portal.
 *
 * These need NavLink's `end` so its OWN matching agrees with `useActivePath`
 * above. The visible styling is ours, but `aria-current="page"` is NavLink's
 * and it wins over anything passed in, so without this a screen reader is told
 * two items are the current page.
 */
function useParentPaths(groups: NavGroup[]): Set<string> {
  return useMemo(() => {
    const paths = groups.flatMap((group) => group.items.map((item) => item.path));
    return new Set(
      paths.filter(
        (path) =>
          // "/" needs `end` unconditionally: react-router treats a bare root
          // path as matching every route, and no sibling literally starts with
          // "//", so the prefix test below cannot catch it.
          path === "/" || paths.some((other) => other.startsWith(`${path}/`)),
      ),
    );
  }, [groups]);
}

function SidebarNav({ collapsed = false, onNavigate, groups = navGroups }: SidebarNavProps) {
  const { pathname } = useLocation();
  const activePath = useActivePath(groups, pathname);
  const parentPaths = useParentPaths(groups);

  return (
    <nav className="flex flex-col gap-4 px-3">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <span className="px-3 pb-1 text-[10.5px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.label}
            </span>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === activePath;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={parentPaths.has(item.path)}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  // Paired with the pill below: the active colour is only
                  // legible ON the pill, so the two must never come apart.
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/25"
                  />
                )}
                <Icon className="relative z-10 size-[18px] shrink-0" />
                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export { SidebarNav };
