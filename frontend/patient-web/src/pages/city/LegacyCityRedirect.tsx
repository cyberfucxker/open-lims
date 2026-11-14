import { Navigate, useParams } from "react-router-dom";

import { buildCityPath } from "@/utils/routes";

/** City pages used to live at `/city/{slug}` and now live at the bare
 *  `/{slug}`. This forwards the old shape so a bookmark, a shared link or a
 *  search result still lands on the right page instead of a 404.
 *
 *  A permanent redirect would be the honest status code, but this is a static
 *  SPA with no server in front of it to send one — so it is a client-side
 *  `replace`, which at least keeps the dead URL out of the visitor's history.
 *  The canonical tag on the destination page is what tells a crawler which
 *  URL is the real one.
 *
 *  A missing slug cannot normally reach here (`/city` has its own route), but
 *  it falls back to Home rather than navigating to a bare `/undefined`. */
function LegacyCityRedirect() {
  const { citySlug } = useParams<{ citySlug?: string }>();
  return <Navigate to={citySlug ? buildCityPath(citySlug) : "/"} replace />;
}

export { LegacyCityRedirect };
