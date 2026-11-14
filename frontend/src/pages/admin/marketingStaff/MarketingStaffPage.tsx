import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Pencil, Plus, RotateCcw, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MarketingStaffFormDialog } from "@/components/marketingStaff/MarketingStaffFormDialog";
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
  useDeleteMarketingStaff,
  useMarketingStaff,
  useRestoreMarketingStaff,
  useSetMarketingStaffStatus,
} from "@/hooks/queries/useMarketingStaff";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { MarketingStaff } from "@/types/marketingStaff";

function MarketingStaffPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editMarketingStaff, setEditMarketingStaff] = useState<MarketingStaff | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useMarketingStaff({
    search,
    active,
    includeDeleted,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const deleteMarketingStaff = useDeleteMarketingStaff();
  const restoreMarketingStaff = useRestoreMarketingStaff();
  const setStatus = useSetMarketingStaffStatus();
  const hasActiveFilters = !!search || active !== "all" || includeDeleted;

  const resetFilters = () => {
    setSearch("");
    setActive("all");
    setIncludeDeleted(false);
    setPageIndex(0);
  };

  const columns = useMemo<ColumnDef<MarketingStaff>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        meta: { label: "Name" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.employeeCode}</p>
          </div>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        meta: { label: "Mobile" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "designation",
        header: "Designation",
        meta: { label: "Designation" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "referralDoctorCount",
        header: "Referral Doctors",
        meta: { label: "Referral Doctors" },
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{String(getValue() ?? 0)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) =>
          row.original.deletedAt ? (
            <StatusBadge status="Deleted" />
          ) : (
            <div className="flex items-center gap-2">
              <Switch
                checked={row.original.status}
                onCheckedChange={(checked) =>
                  setStatus.mutate(
                    { id: row.original.id, status: checked },
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
              <StatusBadge status={row.original.status ? "Active" : "Inactive"} />
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
                    await restoreMarketingStaff.mutateAsync(row.original.id);
                    toast.success(`${row.original.name} restored`);
                  } catch (error) {
                    toast.error(
                      error instanceof ApiRequestError
                        ? error.message
                        : "Failed to restore marketing staff",
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
                  onClick={() => {
                    setEditMarketingStaff(row.original);
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
                  description="This marketing staff member will be hidden from selection lists. You can restore it later."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={async () => {
                    try {
                      await deleteMarketingStaff.mutateAsync(row.original.id);
                      toast.success(`${row.original.name} deleted`);
                    } catch (error) {
                      toast.error(
                        error instanceof ApiRequestError
                          ? error.message
                          : "Failed to delete marketing staff",
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
    [deleteMarketingStaff, restoreMarketingStaff, setStatus],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marketing Staff"
        description="Manage your field marketing staff and their assignments."
        actions={
          <RippleButton
            onClick={() => {
              setEditMarketingStaff(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Marketing Staff
          </RippleButton>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search marketing staff…"
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
              title="Couldn't load marketing staff"
              description="Something went wrong while fetching marketing staff. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No marketing staff found"
              description="Try adjusting your search or filters, or add a new marketing staff member."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />

      <MarketingStaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        marketingStaff={editMarketingStaff}
      />
    </div>
  );
}

export { MarketingStaffPage };
