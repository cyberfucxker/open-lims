import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Printer, Search, TestTube } from "lucide-react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SampleLabelPreviewDialog } from "@/components/samples/SampleLabelPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollectSample, useSamples } from "@/hooks/queries/useSamples";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { SampleRecord, SampleViewStatus } from "@/types/sample";

function PortalSampleCollectionPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<SampleViewStatus>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [labelSample, setLabelSample] = useState<SampleRecord | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useSamples({
    search,
    view,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const collectSample = useCollectSample();

  const columns = useMemo<ColumnDef<SampleRecord>[]>(
    () => [
      {
        accessorKey: "sampleNo",
        header: "Sample No",
        meta: { label: "Sample No" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.sampleNo}</p>
            <p className="text-xs text-muted-foreground">{row.original.appointmentNo}</p>
          </div>
        ),
      },
      {
        accessorKey: "patient",
        header: "Patient",
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground">{row.original.patient.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.patient.mobile}</p>
          </div>
        ),
      },
      {
        accessorKey: "sampleType",
        header: "Sample Type",
        meta: { label: "Sample Type" },
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {row.original.status === "PENDING" && (
              <Button
                size="sm"
                disabled={collectSample.isPending}
                onClick={() =>
                  collectSample.mutate(row.original.id, {
                    onSuccess: () => toast.success(`${row.original.sampleNo} collected`),
                    onError: (error) =>
                      toast.error(
                        error instanceof ApiRequestError
                          ? error.message
                          : "Failed to collect sample",
                      ),
                  })
                }
              >
                Collect
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Print Barcode Label"
              onClick={() => setLabelSample(row.original)}
            >
              <Printer className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [collectSample],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sample Collection"
        description="Collect samples and print barcode labels for your patients."
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search samples…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
            />
          </div>
          <Select
            value={view}
            onValueChange={(v) => {
              setView(v as SampleViewStatus);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading || isFetching}
        totalRows={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load samples"
              description="Something went wrong while fetching samples. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={TestTube}
              title="No samples found"
              description="Samples will appear here once patients are registered."
            />
          )
        }
      />

      <SampleLabelPreviewDialog
        sample={labelSample}
        open={!!labelSample}
        onOpenChange={(open) => !open && setLabelSample(null)}
      />
    </div>
  );
}

export { PortalSampleCollectionPage };
