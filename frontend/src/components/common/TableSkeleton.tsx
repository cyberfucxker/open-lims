import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

function TableSkeleton({ columns, rows = 8 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4" style={{ width: `${55 + ((r + c) % 4) * 10}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export { TableSkeleton };
