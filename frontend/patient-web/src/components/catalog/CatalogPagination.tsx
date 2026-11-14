import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Prev/Next + "Page X of Y" for the Tests/Packages list — plain page
 *  numbers rather than infinite scroll since `total_pages` can run into the
 *  dozens (every bookable Parameter counts as its own page-1 candidate; see
 *  `catalog.service.ts#listTests`'s doc-comment) and a patient jumping
 *  straight back to page 1 after paging deep in is a real, common case. */
function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <span className="text-sm font-medium text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

export { CatalogPagination };
