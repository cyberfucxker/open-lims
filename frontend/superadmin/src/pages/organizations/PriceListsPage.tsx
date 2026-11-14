import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, IndianRupee, Pencil, Plus, RotateCcw, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  useDeletePriceList,
  usePriceLists,
  useRestorePriceList,
  useSetPriceListStatus,
} from "@/hooks/queries/usePriceLists";
import type { PriceList } from "@/services/api/priceListApi";

import { PriceListFormDialog } from "./PriceListFormDialog";

type StatusFilter = "all" | "true" | "false";

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

function PriceListsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editPriceList, setEditPriceList] = useState<PriceList | null>(null);
  const [toDelete, setToDelete] = useState<PriceList | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const listQuery = usePriceLists({
    search: search || undefined,
    active: statusFilter,
    includeDeleted,
    pageSize: 100,
  });

  const setStatus = useSetPriceListStatus();
  const deletePriceList = useDeletePriceList();
  const restorePriceList = useRestorePriceList();

  const rows = listQuery.data?.rows ?? [];
  const hasActiveFilters = !!search || statusFilter !== "all" || includeDeleted;

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setIncludeDeleted(false);
  }

  const columns: DataTableColumn<PriceList>[] = [
    {
      key: "name",
      header: "Price List",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="size-4" />
          </div>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="line-clamp-1 max-w-sm text-sm text-muted-foreground">
          {row.description ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.deletedAt ? (
          <Badge variant="destructive">Deleted</Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Switch
              checked={row.active}
              onCheckedChange={(checked) =>
                setStatus.mutate(
                  { id: row.id, active: checked },
                  {
                    onSuccess: () =>
                      toast.success(`${row.name} ${checked ? "activated" : "deactivated"}`),
                  },
                )
              }
            />
            <Badge variant={row.active ? "success" : "secondary"}>
              {row.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-28",
      className: "text-right",
      render: (row) =>
        row.deletedAt ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await restorePriceList.mutateAsync(row.id);
                toast.success(`${row.name} restored`);
              } catch {
                /* error toast handled by httpClient */
              }
            }}
          >
            <RotateCcw className="size-3.5" /> Restore
          </Button>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Edit prices"
              onClick={() => navigate(`/price-lists/${row.id}/pricing`)}
            >
              <IndianRupee className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Edit"
              onClick={() => {
                setEditPriceList(row);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              title="Delete"
              onClick={() => setToDelete(row)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Price Lists"
        description="Custom test pricing that can be assigned to B2B organizations."
        actions={
          <Button
            onClick={() => {
              setEditPriceList(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Price List
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search price lists..."
            className="min-w-[220px] flex-1"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={includeDeleted}
              onCheckedChange={(checked) => setIncludeDeleted(!!checked)}
            />
            Show deleted
          </label>
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
              : "Failed to load price lists."}
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
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          pageSize={10}
          emptyTitle="No price lists found"
          emptyDescription={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Add a price list to get started."
          }
        />
      )}

      <PriceListFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditPriceList(null);
        }}
        priceList={editPriceList}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete "${toDelete?.name ?? ""}"?`}
        description="This price list will be hidden from selection lists. You can restore it later from the Show deleted filter."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          const name = toDelete.name;
          try {
            await deletePriceList.mutateAsync(toDelete.id);
            toast.success(`${name} deleted`);
          } catch {
            toast.error("Failed to delete price list");
          } finally {
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}

export { PriceListsPage };
