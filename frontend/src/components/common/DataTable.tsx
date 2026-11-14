import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { cn } from "@/utils/cn";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  totalRows: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  getRowId?: (row: T) => string;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  showColumnVisibility?: boolean;
}

function DataTable<T>({
  columns,
  data,
  isLoading,
  totalRows,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  getRowId,
  emptyState,
  toolbar,
  showColumnVisibility = true,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    manualSorting: true,
    manualPagination: true,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: getRowId ? (row: T) => getRowId(row) : undefined,
    getCoreRowModel: getCoreRowModel(),
  });

  const isEmpty = !isLoading && data.length === 0;
  const columnCount = table.getVisibleFlatColumns().length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {(toolbar || showColumnVisibility) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">{toolbar}</div>
          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <SlidersHorizontal className="size-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {(column.columnDef.meta as { label?: string } | undefined)?.label ??
                        column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDir === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : sortDir === "desc" ? (
                          <ArrowDown className="size-3.5" />
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton columns={columnCount} rows={Math.min(pageSize, 8)} />
          ) : isEmpty ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.24) }}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-accent/40",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </TableBody>
      </Table>

      {!isEmpty && (
        <DataTablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

export { DataTable };
