import { useMemo, useRef, useState } from "react";
import { Download, Eye, Package, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import type { DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ImportResultDialog } from "@/components/common/ImportResultDialog";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  useDeletePackage,
  useExportPackagesCsv,
  useImportPackagesCsv,
  usePackages,
  useSetPackageStatus,
} from "@/hooks/queries/usePackages";
import type { CsvImportResult } from "@/services/api/csvImport.types";
import type { PackageDto } from "@/services/api/packageApi";
import { cn } from "@/utils/cn";

import { PackageDetailDialog } from "./CatalogDetailDialog";
import { PackageFormDialog } from "./PackageFormDialog";

const MAX_CHIPS = 3;

function PackagesTab() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageDto | null>(null);
  const [previewPackageId, setPreviewPackageId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      active: activeFilter === "all" ? undefined : activeFilter === "active",
      page: 1,
      pageSize: 100,
    }),
    [search, activeFilter],
  );

  const { data, isLoading, isError, error } = usePackages(queryParams);
  const packages = data?.rows ?? [];

  const setStatus = useSetPackageStatus();
  const deletePackage = useDeletePackage();
  const exportCsv = useExportPackagesCsv();
  const importCsv = useImportPackagesCsv();

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    importCsv.mutate(file, {
      onSuccess: (result) => setImportResult(result),
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to import packages.");
      },
    });
  }

  function handleToggleActive(pkg: PackageDto) {
    setStatus.mutate(
      { id: pkg.id, active: !pkg.active },
      {
        onSuccess: () => {
          toast.success(`${pkg.name} marked as ${!pkg.active ? "active" : "inactive"}.`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update status.");
        },
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deletePackage.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete package.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<PackageDto>[] = [
    {
      key: "serialNo",
      header: "S.No",
      render: (p) => <span className="text-muted-foreground tabular-nums">{p.serialNo}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{p.name}</span>
          <span className="text-xs text-muted-foreground">
            {p.testCount} test{p.testCount === 1 ? "" : "s"}
            {p.parameterCount > 0 &&
              ` + ${p.parameterCount} parameter${p.parameterCount === 1 ? "" : "s"}`}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (p) => (
        <div className="flex flex-col gap-1">
          {p.appCategory ? (
            <Badge variant="outline" className="w-fit whitespace-nowrap">
              {p.appCategory}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          <span className="text-xs text-muted-foreground">
            {p.sampleType ?? "Mixed specimen"}
            {p.isFastingRequired && ` · fasting${p.fastingHours ? ` ${p.fastingHours}h` : ""}`}
          </span>
        </div>
      ),
    },
    {
      key: "included",
      header: "Included",
      render: (p) => {
        const hidden =
          Math.max(p.tests.length - MAX_CHIPS, 0) + Math.max(p.parameters.length - MAX_CHIPS, 0);
        return (
          <div className="flex max-w-64 flex-wrap gap-1">
            {p.tests.slice(0, MAX_CHIPS).map((t) => (
              <Badge key={t.testId} variant="secondary" className="whitespace-nowrap">
                {t.testShortName}
              </Badge>
            ))}
            {p.parameters.slice(0, MAX_CHIPS).map((x) => (
              <Badge
                key={x.parameterId}
                variant="outline"
                className="whitespace-nowrap text-success"
              >
                {x.parameterShortName}
              </Badge>
            ))}
            {hidden > 0 && <Badge variant="outline">+{hidden}</Badge>}
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Package Price vs Sum",
      render: (p) => {
        // Includes standalone parameters — leaving them out would overstate the
        // discount for a package that sells analytes directly.
        const sumOfTests =
          p.tests.reduce((sum, t) => sum + t.price, 0) +
          p.parameters.reduce((sum, x) => sum + x.price, 0);
        const savings = sumOfTests > 0 ? Math.round((1 - p.price / sumOfTests) * 100) : 0;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(p.price)}
            </span>
            {p.offerPrice != null && (
              <span className="text-xs text-success tabular-nums">
                Offer: {formatCurrency(p.offerPrice)}
              </span>
            )}
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(sumOfTests)}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                savings > 0 ? "text-success" : "text-muted-foreground",
              )}
            >
              {savings > 0 ? `${savings}% off` : "No savings"}
            </span>
          </div>
        );
      },
    },
    {
      key: "popularity",
      header: "Popularity",
      render: (p) => (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="w-fit tabular-nums">
            {formatNumber(p.bookedCount)} orders
          </Badge>
          {p.isPopular && <Badge className="w-fit">Popular</Badge>}
        </div>
      ),
    },
    {
      key: "sortOrder",
      header: "Sort Order",
      render: (p) => <span className="tabular-nums text-foreground">{p.sortOrder}</span>,
    },
    {
      key: "active",
      header: "Active",
      render: (p) => <Switch checked={p.active} onCheckedChange={() => handleToggleActive(p)} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Preview what the patient app shows"
            onClick={() => setPreviewPackageId(p.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setEditingPackage(p);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(p)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={exportCsv.isPending}
              onClick={() =>
                exportCsv.mutate(undefined, {
                  onError: (err) => {
                    toast.error(err instanceof Error ? err.message : "Failed to export packages.");
                  },
                })
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={importCsv.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {importCsv.isPending ? "Importing..." : "Import CSV"}
            </Button>
            <Button
              onClick={() => {
                setEditingPackage(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Package
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Package}
          title="Couldn't load packages"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : packages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No packages found"
          description="Try adjusting your search or filters, or add a new package."
          action={
            <Button
              onClick={() => {
                setEditingPackage(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Package
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={packages} rowKey={(p) => p.id} pageSize={10} />
      )}

      <PackageFormDialog open={formOpen} onOpenChange={setFormOpen} pkg={editingPackage} />

      <PackageDetailDialog
        packageId={previewPackageId}
        onOpenChange={(open) => !open && setPreviewPackageId(null)}
      />

      <ImportResultDialog result={importResult} onClose={() => setImportResult(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete package?"
        description={`This will permanently remove "${deleteTarget?.name}" from the catalog. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { PackagesTab };
