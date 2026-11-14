import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  BadgeIndianRupee,
  FileBarChart,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundSearch,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AssignPriceListDialog } from "@/components/referrals/AssignPriceListDialog";
import { ReferralFormDialog } from "@/components/referrals/ReferralFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useDeleteReferralSource,
  useReferralSources,
  useSetReferralSourceStatus,
} from "@/hooks/queries/useReferralSources";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReferralSource, ReferralType } from "@/types/referralSource";

const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  DOCTOR: "Doctor",
  HOSPITAL: "Hospital",
  CLINIC: "Clinic",
  SELF: "Self",
  CORPORATE: "Corporate",
  OTHER: "Other",
};

function ReferralsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [referralType, setReferralType] = useState("all");
  const [active, setActive] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editReferralSource, setEditReferralSource] = useState<ReferralSource | null>(null);
  const [priceListDialogOpen, setPriceListDialogOpen] = useState(false);
  const [priceListReferralSource, setPriceListReferralSource] = useState<ReferralSource | null>(
    null,
  );

  const { data, isLoading, isFetching, isError, refetch } = useReferralSources({
    search,
    active,
    includeDeleted,
    referralType: referralType === "all" ? undefined : (referralType as ReferralType),
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const deleteReferralSource = useDeleteReferralSource();
  const setStatus = useSetReferralSourceStatus();
  const hasActiveFilters = !!search || referralType !== "all" || active !== "all" || includeDeleted;

  const resetFilters = () => {
    setSearch("");
    setReferralType("all");
    setActive("all");
    setIncludeDeleted(false);
    setPageIndex(0);
  };

  const columns = useMemo<ColumnDef<ReferralSource>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Referral Name",
        meta: { label: "Referral Name" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.referralCode}</p>
          </div>
        ),
      },
      {
        accessorKey: "referralType",
        header: "Referral Type",
        meta: { label: "Referral Type" },
        cell: ({ row }) => (
          <Badge variant="outline">{REFERRAL_TYPE_LABELS[row.original.referralType]}</Badge>
        ),
      },
      {
        accessorKey: "organizationName",
        header: "Organization",
        meta: { label: "Organization" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "assignedPriceListName",
        header: "Assigned Price List",
        meta: { label: "Assigned Price List" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
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
        cell: ({ row }) => {
          const referralSource = row.original;
          const isDeleted = !!referralSource.deletedAt;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={isDeleted}
                  onClick={() => {
                    setPriceListReferralSource(referralSource);
                    setPriceListDialogOpen(true);
                  }}
                >
                  <Wallet className="size-4" /> Assign Price List
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/admin/referrals/incentives?referralSourceId=${referralSource.id}`)
                  }
                >
                  <BadgeIndianRupee className="size-4" /> View Incentives
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isDeleted}
                  onClick={() =>
                    navigate(`/admin/referrals/settlements?generateFor=${referralSource.id}`)
                  }
                >
                  <FileBarChart className="size-4" /> Generate Settlement
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isDeleted}
                  onClick={() => {
                    setEditReferralSource(referralSource);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
                {!isDeleted && (
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    }
                    title={`Delete "${referralSource.name}"?`}
                    description="This referral source will be hidden from selection lists. You can restore it later."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={async () => {
                      try {
                        await deleteReferralSource.mutateAsync(referralSource.id);
                        toast.success(`${referralSource.name} deleted`);
                      } catch (error) {
                        toast.error(
                          error instanceof ApiRequestError
                            ? error.message
                            : "Failed to delete referral",
                        );
                        throw error;
                      }
                    }}
                  />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [deleteReferralSource, navigate, setStatus],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Referral"
        description="Manage referral sources — doctors, hospitals, clinics, and other partners."
        actions={
          <RippleButton
            onClick={() => {
              setEditReferralSource(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Referral
          </RippleButton>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search referrals…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>
            <Select
              value={referralType}
              onValueChange={(v) => {
                setReferralType(v);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Referral Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(REFERRAL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load referrals"
              description="Something went wrong while fetching referrals. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={UserRoundSearch}
              title="No referrals found"
              description="Try adjusting your search or filters, or add a new referral."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )
        }
      />

      <ReferralFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        referralSource={editReferralSource}
      />
      <AssignPriceListDialog
        open={priceListDialogOpen}
        onOpenChange={setPriceListDialogOpen}
        referralSource={priceListReferralSource}
      />
    </div>
  );
}

export { ReferralsPage };
