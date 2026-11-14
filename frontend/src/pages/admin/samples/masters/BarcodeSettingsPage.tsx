import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Barcode, Pencil, Search } from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BarcodeConfigFormDialog } from "@/components/masters/BarcodeConfigFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSampleTypeBarcodeConfigs } from "@/hooks/queries/useSampleTypeBarcodeConfigs";
import type { SampleTypeBarcodeConfig } from "@/types/master";

function BarcodeSettingsPage() {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<SampleTypeBarcodeConfig | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useSampleTypeBarcodeConfigs({
    search,
    page: pageIndex + 1,
    pageSize,
  });

  const columns = useMemo<ColumnDef<SampleTypeBarcodeConfig>[]>(
    () => [
      { accessorKey: "sampleTypeName", header: "Sample Type", meta: { label: "Sample Type" } },
      {
        id: "prefix",
        header: "Prefix",
        meta: { label: "Prefix" },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.prefix ?? "--"}</span>,
      },
      {
        id: "preview",
        header: "Format Preview",
        meta: { label: "Format Preview" },
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.prefix
              ? `${row.original.prefix}${"1".padStart(row.original.numberLength, "0")}`
              : "--"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => (
          <StatusBadge
            status={
              row.original.prefix ? (row.original.active ? "Active" : "Inactive") : "Not Configured"
            }
          />
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setEditConfig(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Barcode Settings"
        description="Set the auto-generation barcode prefix and number length for each sample type."
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sample types…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
            />
          </div>
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
        sorting={[]}
        onSortingChange={() => {}}
        getRowId={(row) => row.sampleTypeId}
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load barcode settings"
              description="Something went wrong while fetching barcode settings. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Barcode}
              title="No sample types found"
              description="Try adjusting your search."
            />
          )
        }
      />

      <BarcodeConfigFormDialog open={formOpen} onOpenChange={setFormOpen} config={editConfig} />
    </div>
  );
}

export { BarcodeSettingsPage };
