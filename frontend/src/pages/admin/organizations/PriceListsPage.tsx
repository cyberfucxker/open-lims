import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { ListChecks, Pencil, Plus, RotateCcw, Search, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriceListFormDialog } from "@/components/organizations/PriceListFormDialog";
import { PriceListItemsSheet } from "@/components/organizations/PriceListItemsSheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useDeletePriceList,
  usePriceLists,
  useRestorePriceList,
  useSetPriceListStatus,
} from "@/hooks/queries/usePriceLists";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { PriceList } from "@/types/priceList";

function PriceListsPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editPriceList, setEditPriceList] = useState<PriceList | null>(null);
  const [itemsPriceList, setItemsPriceList] = useState<PriceList | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = usePriceLists({
    search,
    active,
    includeDeleted,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const deletePriceList = useDeletePriceList();
  const restorePriceList = useRestorePriceList();
  const setStatus = useSetPriceListStatus();
  const hasActiveFilters = !!search || active !== "all" || includeDeleted;

  const resetFilters = () => {
    setSearch("");
    setActive("all");
    setIncludeDeleted(false);
    setPageIndex(0);
  };

  const columns = useMemo<ColumnDef<PriceList>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Price List",
        meta: { label: "Price List" },
        cell: ({ row }) => (
          <p className="text-sm font-medium text-foreground">{row.original.name}</p>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        meta: { label: "Description" },
        cell: ({ getValue }) => (
          <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
            {String(getValue() ?? "—")}
          </span>
        ),
      },
      {
        accessorKey: "active",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) =>
          row.original.deletedAt ? (
            <StatusBadge status="Deleted" />
          ) : (
            <div className="flex items-center gap-2">
              <Switch
                checked={row.original.active}
                onCheckedChange={(checked) =>
                  setStatus.mutate(
                    { id: row.original.id, active: checked },
                    {
                      onError: (error) =>
                        toast.error(
                          error instanceof ApiRequestError
                            ? error.message
                            : "Failed to update status",
                        ),
                    },
                  )
                }
              />
              <StatusBadge status={row.original.active ? "Active" : "Inactive"} />
            </div>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {row.original.deletedAt ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                title="Restore"
                onClick={async () => {
                  try {
                    await restorePriceList.mutateAsync(row.original.id);
                    toast.success(`${row.original.name} restored`);
                  } catch (error) {
                    toast.error(
                      error instanceof ApiRequestError
                        ? error.message
                        : "Failed to restore price list",
                    );
                  }
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Edit Test Prices"
                  onClick={() => setItemsPriceList(row.original)}
                >
                  <ListChecks className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setEditPriceList(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                  title={`Delete "${row.original.name}"?`}
                  description="This price list will be hidden from selection lists. You can restore it later."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={async () => {
                    try {
                      await deletePriceList.mutateAsync(row.original.id);
                      toast.success(`${row.original.name} deleted`);
                    } catch (error) {
                      toast.error(
                        error instanceof ApiRequestError
                          ? error.message
                          : "Failed to delete price list",
                      );
                      throw error;
                    }
                  }}
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [deletePriceList, restorePriceList, setStatus],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Price Lists"
        description="Custom test pricing that can be assigned to B2B organizations."
        actions={
          <RippleButton
            onClick={() => {
              setEditPriceList(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Price List
          </RippleButton>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search price lists…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>
            <Select
              value={active}
              onValueChange={(v) => {
                setActive(v);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Checkbox
                checked={includeDeleted}
                onCheckedChange={(checked) => {
                  setIncludeDeleted(!!checked);
                  setPageIndex(0);
                }}
              />
              Show deleted
            </label>
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
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load price lists"
              description="Something went wrong while fetching price lists. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Tag}
              title="No price lists found"
              description="Try adjusting your search or filters, or add a new price list."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />

      <PriceListFormDialog open={formOpen} onOpenChange={setFormOpen} priceList={editPriceList} />
      <PriceListItemsSheet
        priceList={itemsPriceList}
        open={!!itemsPriceList}
        onOpenChange={(open) => !open && setItemsPriceList(null)}
      />
    </div>
  );
}

export { PriceListsPage };
