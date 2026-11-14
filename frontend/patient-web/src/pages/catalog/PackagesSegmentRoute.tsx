import { useParams } from "react-router-dom";

import { isUuid } from "@/utils/uuid";
import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { PackageDetailPage } from "@/pages/catalog/PackageDetailPage";

/** `/packages/:id`'s twin of `TestsSegmentRoute` — see that file's doc-comment. */
function PackagesSegmentRoute() {
  const { id } = useParams<{ id: string }>();
  return isUuid(id ?? "") ? <PackageDetailPage /> : <CatalogPage citySlug={id} />;
}

export { PackagesSegmentRoute };
