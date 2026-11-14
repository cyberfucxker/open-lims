import { useCallback, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Pencil, Plus, RotateCcw, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

import { AssignDoctorDialog } from "@/components/marketingStaff/AssignDoctorDialog";
import { ReferralDoctorFormDialog } from "@/components/marketingStaff/ReferralDoctorFormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
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
  useDeleteReferralDoctor,
  useReferralDoctors,
  useRestoreReferralDoctor,
  useSetReferralDoctorStatus,
} from "@/hooks/queries/useReferralDoctors";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { MarketingStaff } from "@/types/marketingStaff";
import type { ReferralDoctor } from "@/types/referralDoctor";

const STAFF_FILTER_ALL = "all";
const STAFF_FILTER_UNASSIGNED = "unassigned";

/**
 * Temporary local fetch for the active marketing staff filter/picker.
 * `useMarketingStaff.ts` (built by a parallel agent) does not yet expose a
 * dedicated "active staff" hook, so this queries the endpoint directly.
 * Safe to replace with a shared hook from useMarketingStaff.ts once available.
 */
function useActiveMarketingStaffOptions() {
  return useQuery({
    queryKey: ["marketingStaff", "active"],
    queryFn: async () => {
      const response =
        await httpClient.get<ApiResponseBody<MarketingStaff[]>>("/marketing-staff/active");
      return (response.data.data as MarketingStaff[]) ?? [];
    },
    staleTime: 60_000,
  });
}

function ReferralDoctorsPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [staffFilter, setStaffFilter] = useState(STAFF_FILTER_ALL);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<ReferralDoctor | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: staffList } = useActiveMarketingStaffOptions();

  const marketingStaffId =
    staffFilter !== STAFF_FILTER_ALL && staffFilter !== STAFF_FILTER_UNASSIGNED
      ? staffFilter
      : undefined;
  const unassignedOnly = staffFilter === STAFF_FILTER_UNASSIGNED;

  const { data, isLoading, isFetching, isError, refetch } = useReferralDoctors({
    search,
    active,
    includeDeleted,
    marketingStaffId,
    unassignedOnly,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const deleteReferralDoctor = useDeleteReferralDoctor();
  const restoreReferralDoctor = useRestoreReferralDoctor();
  const setStatus = useSetReferralDoctorStatus();

  const hasActiveFilters =
    !!search || active !== "all" || includeDeleted || staffFilter !== STAFF_FILTER_ALL;

  const resetFilters = () => {
    setSearch("");
    setActive("all");
    setIncludeDeleted(false);
    setStaffFilter(STAFF_FILTER_ALL);
    setPageIndex(0);
  };

  const rows = data?.rows ?? [];
  const selectableRows = rows.filter((row) => !row.deletedAt);
  const allSelectedOnPage =
    selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.id));

  const toggleRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableRows.forEach((row) => {
          if (checked) next.add(row.id);
          else next.delete(row.id);
        });
        return next;
      });
    },
    [selectableRows],
  );

  const staffFilterOptions = [
    { value: STAFF_FILTER_ALL, label: "All Marketing Staff" },
    { value: STAFF_FILTER_UNASSIGNED, label: "Unassigned only" },
    ...(staffList ?? []).map((staff) => ({
      value: staff.id,
      label: staff.name,
      description: staff.employeeCode,
    })),
  ];

  const columns = useMemo<ColumnDef<ReferralDoctor>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelectedOnPage}
            onCheckedChange={(checked) => toggleAllOnPage(!!checked)}
            aria-label="Select all on page"
          />
        ),
        enableSorting: false,
        meta: { label: "Select" },
        cell: ({ row }) =>
          row.original.deletedAt ? null : (
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={(checked) => toggleRow(row.original.id, !!checked)}
              aria-label={`Select ${row.original.doctorName}`}
            />
          ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor Name",
        meta: { label: "Doctor Name" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.doctorName}</p>
            {row.original.hospitalName && (
              <p className="text-xs text-muted-foreground">{row.original.hospitalName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "speciality",
        header: "Speciality",
        meta: { label: "Speciality" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        meta: { label: "City" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        meta: { label: "Mobile" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "marketingStaffName",
        header: "Marketing Staff",
        meta: { label: "Marketing Staff" },
        cell: ({ row }) =>
          row.original.marketingStaffName ? (
            <span className="text-sm text-foreground">{row.original.marketingStaffName}</span>
          ) : (
            <span className="text-sm text-muted-foreground italic">Unassigned</span>
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
                    await restoreReferralDoctor.mutateAsync(row.original.id);
                    toast.success(`${row.original.doctorName} restored`);
                  } catch (error) {
                    toast.error(
                      error instanceof ApiRequestError
                        ? error.message
                        : "Failed to restore referral doctor",
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
                    setEditDoctor(row.original);
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
                  title={`Delete "${row.original.doctorName}"?`}
                  description="This referral doctor will be hidden from selection lists. You can restore it later."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={async () => {
                    try {
                      await deleteReferralDoctor.mutateAsync(row.original.id);
                      toast.success(`${row.original.doctorName} deleted`);
                    } catch (error) {
                      toast.error(
                        error instanceof ApiRequestError
                          ? error.message
                          : "Failed to delete referral doctor",
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
    [
      allSelectedOnPage,
      selectedIds,
      toggleRow,
      toggleAllOnPage,
      deleteReferralDoctor,
      restoreReferralDoctor,
      setStatus,
    ],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Referral Doctors"
        description="Manage referral doctors and their assigned marketing staff."
        actions={
          <>
            <RippleButton
              variant="outline"
              disabled={selectedIds.size === 0}
              onClick={() => setAssignOpen(true)}
            >
              <Users className="size-4" /> Bulk Assign
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </RippleButton>
            <RippleButton
              onClick={() => {
                setEditDoctor(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add Referral Doctor
            </RippleButton>
          </>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search referral doctors…"
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
            <div className="w-56">
              <SearchableSelect
                options={staffFilterOptions}
                value={staffFilter}
                onChange={(v) => {
                  setStaffFilter(v);
                  setPageIndex(0);
                }}
                placeholder="All Marketing Staff"
                searchPlaceholder="Search staff…"
                className="h-9"
              />
            </div>
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
        data={rows}
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
              title="Couldn't load referral doctors"
              description="Something went wrong while fetching referral doctors. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No referral doctors found"
              description="Try adjusting your search or filters, or add a new referral doctor."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />

      <ReferralDoctorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        referralDoctor={editDoctor}
      />

      <AssignDoctorDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        doctorIds={Array.from(selectedIds)}
        onAssigned={() => setSelectedIds(new Set())}
      />
    </div>
  );
}

export { ReferralDoctorsPage };
