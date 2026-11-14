import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  IndianRupee,
  Package,
  Pencil,
  Plus,
  Power,
  RotateCcw,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations, usePriceListOptions } from "@/hooks/queries/useOrganizations";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { FranchiseType, Organization } from "@/services/api/organizationApi";
import { cn } from "@/utils/cn";

import { OrganizationDetailDrawer } from "./OrganizationDetailDrawer";
import { OrganizationFormDialog } from "./OrganizationFormDialog";

type TypeFilter = "all" | FranchiseType;

const PAGE_SIZE = 10;

const FRANCHISE_TYPE_BADGE: Record<
  FranchiseType,
  { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
  SINGLE_LAB: { label: "Single Lab", variant: "info" },
  CO_LAB: { label: "Co-Lab", variant: "success" },
};

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

function OrganizationsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editOrganization, setEditOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const listQuery = useOrganizations({
    search: search || undefined,
    franchiseType: typeFilter === "all" ? undefined : typeFilter,
    page,
    pageSize: PAGE_SIZE,
  });
  const priceListsQuery = usePriceListOptions();

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeLogins = rows.filter((o) => o.login?.isActive).length;

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setTypeFilter("all");
  }

  const columns: DataTableColumn<Organization>[] = [
    {
      key: "name",
      header: "Org Name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-mono text-xs tracking-wider text-muted-foreground">{row.code}</span>
      ),
    },
    {
      key: "franchiseType",
      header: "Type",
      render: (row) => (
        <Badge variant={FRANCHISE_TYPE_BADGE[row.franchiseType].variant}>
          {FRANCHISE_TYPE_BADGE[row.franchiseType].label}
        </Badge>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (row) => (
        <span className="text-sm text-foreground">{row.cityName ?? row.city ?? "—"}</span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-foreground">{row.contactPerson ?? "—"}</span>
          <span className="text-xs tabular-nums text-muted-foreground">{row.mobile}</span>
        </div>
      ),
    },
    {
      key: "activeLogin",
      header: "Portal Login",
      render: (row) => (
        <Badge variant={row.login?.isActive ? "success" : "outline"}>
          {row.login?.isActive ? "Active" : row.login ? "Disabled" : "Not set up"}
        </Badge>
      ),
    },
    {
      key: "orderCount",
      header: "Order Count",
      render: (row) => (
        <span className="font-medium tabular-nums">{formatNumber(row.orderCount)}</span>
      ),
    },
    {
      key: "settlementDue",
      header: "Settlement Due",
      render: (row) => (
        <span
          className={cn(
            "font-semibold tabular-nums",
            row.settlementDue > 0 ? "text-warning" : "text-muted-foreground",
          )}
        >
          {formatCurrency(row.settlementDue)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-32",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrgId(row.id);
            }}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              setEditOrganization(row);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Franchise Management"
        description="Onboard franchises and manage their logins, price lists, and settlements."
        actions={
          <Button
            onClick={() => {
              setEditOrganization(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Franchise
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {listQuery.isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Organizations"
              value={formatNumber(total)}
              icon={Building2}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Active Logins (this page)"
              value={formatNumber(activeLogins)}
              icon={Power}
              gradient="bg-emerald-500"
              index={1}
            />
            <StatCard
              title="Total Settlement Due"
              value={formatCurrency(listQuery.data?.totalSettlementDue ?? 0)}
              icon={IndianRupee}
              gradient="bg-amber-500"
              index={2}
              alert={(listQuery.data?.totalSettlementDue ?? 0) > 0}
            />
            <StatCard
              title="Total Order Volume"
              value={formatNumber(listQuery.data?.totalOrderVolume ?? 0)}
              icon={Package}
              gradient="bg-sky-500"
              index={3}
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by franchise name, code, contact, mobile, or city..."
            className="min-w-[220px] flex-1"
          />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SINGLE_LAB">Single Lab</SelectItem>
              <SelectItem value="CO_LAB">Co-Lab</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </CardContent>
      </Card>

      {listQuery.isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Failed to load organizations."}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => listQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : listQuery.isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            pageSize={PAGE_SIZE}
            onRowClick={(row) => setSelectedOrgId(row.id)}
            emptyTitle="No organizations found"
            emptyDescription="Try adjusting your search or filters."
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 px-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <OrganizationDetailDrawer
        organizationId={selectedOrgId}
        open={selectedOrgId !== null}
        onOpenChange={(open) => !open && setSelectedOrgId(null)}
      />

      <OrganizationFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditOrganization(null);
        }}
        priceLists={priceListsQuery.data ?? []}
        organization={editOrganization}
      />
    </div>
  );
}

export { OrganizationsPage };
