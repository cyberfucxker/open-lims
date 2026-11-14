import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Orders and Reports pages are the same page twice: a search box plus
 * optional filters, a paginated table, and the same loading, error and empty
 * states. This holds that shape once so the two stay consistent and a fix to
 * (say) the error banner lands in both.
 *
 * Deliberately not pushed into `components/common`: it encodes franchise-portal
 * list conventions, not a general-purpose primitive, and the admin pages have
 * their own established (and different) layouts.
 */
interface FranchiseListShellProps<T> {
  title: string;
  description: string;
  /** Rendered next to the title, e.g. a "Create Order" button. */
  actions?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Extra controls rendered between the search box and Reset. */
  filters?: ReactNode;
  onReset: () => void;

  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;

  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;

  emptyTitle: string;
  emptyDescription: string;
  /** Rendered above the table — stat tiles, a callout, etc. */
  children?: ReactNode;
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

function FranchiseListShell<T>({
  title,
  description,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  onReset,
  columns,
  rows,
  rowKey,
  onRowClick,
  isLoading,
  error,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
  emptyTitle,
  emptyDescription,
  children,
}: FranchiseListShellProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} description={description} actions={actions} />

      {children}

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-[240px] flex-1"
          />
          {filters}
          <Button variant="outline" size="sm" className="ml-auto" onClick={onReset}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error instanceof Error ? error.message : `Failed to load ${title}.`}</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={rowKey}
            onRowClick={onRowClick}
            pageSize={pageSize}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 px-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { FranchiseListShell };
