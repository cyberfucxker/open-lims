import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/utils/cn";

interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function DataTable<T>({
  columns,
  data,
  rowKey,
  pageSize = 10,
  onRowClick,
  rowClassName,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search query.",
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageData = useMemo(
    () => data.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize),
    [data, clampedPage, pageSize],
  );

  if (data.length === 0) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("whitespace-nowrap", col.headerClassName)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
          <span>
            Showing {clampedPage * pageSize + 1}-
            {Math.min(data.length, (clampedPage + 1) * pageSize)} of {data.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={clampedPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-16 text-center text-xs font-medium">
              Page {clampedPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={clampedPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
export type { DataTableColumn };
