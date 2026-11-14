import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Building2,
  Download,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { OrganizationDetailSheet } from "@/components/organizations/OrganizationDetailSheet";
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
  useDeleteOrganization,
  useOrganizations,
  useRestoreOrganization,
  useSetOrganizationStatus,
} from "@/hooks/queries/useOrganizations";
import {
  fetchOrganizationsExcelBlob,
  fetchOrganizationsPdfBlob,
} from "@/services/api/organization.api";
import { downloadBlob } from "@/services/api/billApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { Organization } from "@/types/organization";

const TYPE_LABEL: Record<Organization["type"], string> = {
  GENERAL_CENTER: "General Center",
  COLLECTION_CENTER: "Collection Center",
};

function OrganizationsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [active, setActive] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [viewOrganization, setViewOrganization] = useState<Organization | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const params = {
    search,
    type: type === "all" ? undefined : (type as Organization["type"]),
    active,
    includeDeleted,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? ("desc" as const) : ("asc" as const),
    page: pageIndex + 1,
    pageSize,
  };

  const { data, isLoading, isFetching, isError, refetch } = useOrganizations(params);

  const deleteOrganization = useDeleteOrganization();
  const restoreOrganization = useRestoreOrganization();
  const setStatus = useSetOrganizationStatus();
  const hasActiveFilters = !!search || type !== "all" || active !== "all" || includeDeleted;

  const resetFilters = () => {
    setSearch("");
    setType("all");
    setActive("all");
    setIncludeDeleted(false);
    setPageIndex(0);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    setIsExporting(true);
    try {
      const blob =
        format === "excel"
          ? await fetchOrganizationsExcelBlob(params)
          : await fetchOrganizationsPdfBlob(params);
      downloadBlob(blob, format === "excel" ? "organizations.xlsx" : "organizations.pdf");
    } catch {
      toast.error(`Failed to export ${format === "excel" ? "Excel" : "PDF"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<Organization>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        meta: { label: "Organization" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        meta: { label: "Type" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{TYPE_LABEL[row.original.type]}</span>
        ),
      },
      {
        accessorKey: "contactPerson",
        header: "Contact",
        meta: { label: "Contact" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground">{row.original.contactPerson ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{row.original.mobile}</p>
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "Location",
        meta: { label: "Location" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {[row.original.city, row.original.state].filter(Boolean).join(", ") || "—"}
          </span>
        ),
      },
      {
        id: "login",
        header: "Login",
        meta: { label: "Login" },
        cell: ({ row }) =>
          row.original.loginEnabled ? (
            <StatusBadge status="Active" />
          ) : (
            <span className="text-xs text-muted-foreground">Disabled</span>
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
                    await restoreOrganization.mutateAsync(row.original.id);
                    toast.success(`${row.original.name} restored`);
                  } catch (error) {
                    toast.error(
                      error instanceof ApiRequestError
                        ? error.message
                        : "Failed to restore organization",
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
                  title="View"
                  onClick={() => setViewOrganization(row.original)}
                >
                  <Eye className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Edit"
                  onClick={() => navigate(`/admin/organizations/${row.original.id}/edit`)}
                >
                  <Pencil className="size-4" />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                  title={`Delete "${row.original.name}"?`}
                  description="This organization will be hidden from selection lists and its portal login (if any) disabled. You can restore it later."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={async () => {
                    try {
                      await deleteOrganization.mutateAsync(row.original.id);
                      toast.success(`${row.original.name} deleted`);
                    } catch (error) {
                      toast.error(
                        error instanceof ApiRequestError
                          ? error.message
                          : "Failed to delete organization",
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
    [deleteOrganization, restoreOrganization, setStatus, navigate],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organizations"
        description="Manage B2B partners — General Centers and Collection Centers."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={isExporting} onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
            <Button variant="outline" disabled={isExporting} onClick={() => handleExport("pdf")}>
              <Download className="size-4" /> PDF
            </Button>
            <RippleButton onClick={() => navigate("/admin/organizations/add")}>
              <Plus className="size-4" /> Add Organization
            </RippleButton>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GENERAL_CENTER">General Center</SelectItem>
                <SelectItem value="COLLECTION_CENTER">Collection Center</SelectItem>
              </SelectContent>
            </Select>
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
        showColumnVisibility
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load organizations"
              description="Something went wrong while fetching organizations. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Building2}
              title="No organizations found"
              description="Try adjusting your search or filters, or add a new organization."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />

      <OrganizationDetailSheet
        organization={viewOrganization}
        open={!!viewOrganization}
        onOpenChange={(open) => !open && setViewOrganization(null)}
      />
    </div>
  );
}

export { OrganizationsPage };
