import { useParams } from "react-router-dom";

import { isUuid } from "@/utils/uuid";
import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { TestDetailPage } from "@/pages/catalog/TestDetailPage";

/** `/tests/:id` carries two different meanings that happen to share the same
 *  shape: a bare Test id — the pre-city-pick detail fallback `TestCard`
 *  builds when no city is selected yet — and a city slug, the list page's
 *  SEO landing url (`/tests/{citySlug}`, the counterpart to
 *  `/tests/{citySlug}/{testSlug}`). Every Test id is a DB
 *  `gen_random_uuid()`; no city slug is ever UUID-shaped, so that's the
 *  discriminant. */
function TestsSegmentRoute() {
  const { id } = useParams<{ id: string }>();
  return isUuid(id ?? "") ? <TestDetailPage /> : <CatalogPage citySlug={id} />;
}

export { TestsSegmentRoute };
