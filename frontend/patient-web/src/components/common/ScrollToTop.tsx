import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** React Router doesn't reset scroll position on navigation the way a
 *  traditional multi-page site does — clicking a footer/nav link to a new
 *  route keeps whatever scroll offset the previous page was at (e.g. a
 *  footer link clicked from the bottom of Home lands the new page's bottom
 *  in view instead of its top). Mounted once at the root, above `<AppRoutes />`,
 *  so it fires for every route change regardless of which layout is active.
 *
 *  `useLayoutEffect`-style timing isn't needed here: this runs on `pathname`
 *  change (not every render), and `behavior: "instant"` avoids the smooth-
 *  scroll animation fighting with AppShell's page-transition animation. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export { ScrollToTop };
