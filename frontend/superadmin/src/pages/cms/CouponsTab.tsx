import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
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
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useCoupons, useDeleteCoupon, useSetCouponStatus } from "@/hooks/queries/useCoupons";
import type { Coupon } from "@/services/api/couponApi";

import { CouponFormDialog } from "./CouponFormDialog";
import { HomeCouponsSection } from "./HomeCouponsSection";

type ActiveFilter = "all" | "active" | "inactive";

function formatDiscount(coupon: Coupon) {
  return coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}% off`
    : `${formatCurrency(coupon.discountValue)} off`;
}

function CouponsTab() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useCoupons({
    search: search || undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    page: 1,
    pageSize: 100,
  });
  const coupons = data?.rows ?? [];

  const setStatus = useSetCouponStatus();
  const deleteCoupon = useDeleteCoupon();

  function openAddDialog() {
    setEditingCoupon(null);
    setFormOpen(true);
  }

  function openEditDialog(coupon: Coupon) {
    setEditingCoupon(coupon);
    setFormOpen(true);
  }

  function handleToggleActive(coupon: Coupon, isActive: boolean) {
    setStatus.mutate(
      { id: coupon.id, isActive },
      {
        onSuccess: () =>
          toast.success(
            isActive ? `"${coupon.code}" is now active` : `"${coupon.code}" was deactivated`,
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update coupon status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteCoupon.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Coupon "${target.code}" was deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete coupon.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      render: (c) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold tracking-wide text-foreground">
            {c.code}
          </span>
          <span className="text-xs text-muted-foreground">{c.title}</span>
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (c) => (
        <span className="text-sm font-medium text-foreground">{formatDiscount(c)}</span>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      render: (c) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {c.validFrom ? formatDate(c.validFrom) : "Anytime"} –{" "}
          {c.validTo ? formatDate(c.validTo) : "No expiry"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (c) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatNumber(c.usedCount)}
          {c.totalUsageLimit != null ? ` / ${formatNumber(c.totalUsageLimit)}` : ""}
          {c.usageLimitPerUser != null && (
            <span className="ml-1 text-[11px]">({c.usageLimitPerUser}/user)</span>
          )}
        </span>
      ),
    },
    {
      key: "active",
      header: "Active",
      render: (c) => (
        <Switch
          checked={c.isActive}
          onCheckedChange={(checked) => handleToggleActive(c, checked)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-24",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(c)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <HomeCouponsSection />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by coupon code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All coupons</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add Coupon
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Ticket}
          title="Couldn't load coupons"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons found"
          description="Try adjusting your search or filter, or create a new coupon."
          action={
            <Button onClick={openAddDialog} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Coupon
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={coupons} rowKey={(c) => c.id} pageSize={8} />
      )}

      <CouponFormDialog open={formOpen} onOpenChange={setFormOpen} coupon={editingCoupon} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete coupon?"
        description={`Coupon "${deleteTarget?.code ?? ""}" will be permanently removed and can no longer be redeemed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { CouponsTab };
