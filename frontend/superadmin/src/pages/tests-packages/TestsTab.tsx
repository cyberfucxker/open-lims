import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FlaskConical, Pencil, Plus, Trash2, Upload } from "lucide-react";
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
import { useAppCategories } from "@/hooks/queries/useAppCategories";
import {
  useDeleteTest,
  useExportTestsCsv,
  useImportTestsCsv,
  useTests,
  useUpdateTest,
} from "@/hooks/queries/useTests";
import type { CsvImportResult } from "@/services/api/csvImport.types";
import type { LabTest, TestStatus } from "@/services/api/testApi";

import { TestDetailDialog } from "./CatalogDetailDialog";
import { TestFormDialog } from "./TestFormDialog";

interface TestsTabProps {
  initialSearch?: string;
}

function TestsTab({ initialSearch }: TestsTabProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [appCategoryId, setAppCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabTest | null>(null);
  const [previewTestId, setPreviewTestId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  // Filters by the CMS category tile, matching what the form now sets. The lab's
  // internal Department is no longer collected there, so filtering by it would
  // return nothing for every test created from the form.
  const { data: appCategoriesResult } = useAppCategories({ page: 1, pageSize: 100 });
  const appCategories = appCategoriesResult?.rows ?? [];

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      appCategoryId: appCategoryId === "all" ? undefined : appCategoryId,
      status: statusFilter === "all" ? undefined : (statusFilter as TestStatus),
      page: 1,
      pageSize: 100,
    }),
    [search, appCategoryId, statusFilter],
  );

  const { data, isLoading, isError, error } = useTests(queryParams);
  const tests = data?.rows ?? [];

  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();
  const exportCsv = useExportTestsCsv();
  const importCsv = useImportTestsCsv();

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    importCsv.mutate(file, {
      onSuccess: (result) => setImportResult(result),
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to import tests.");
      },
    });
  }

  function handleToggleActive(test: LabTest) {
    const nextStatus: TestStatus = test.status === "Active" ? "Inactive" : "Active";
    updateTest.mutate(
      {
        id: test.id,
        values: {
          name: test.name,
          shortName: test.shortName,
          departmentId: test.departmentId,
          categoryId: test.categoryId,
          appCategoryId: test.appCategoryId,
          price: test.price,
          sampleTypeId: test.sampleTypeId,
          reportTime: test.reportTime,
          description: test.description,
          status: nextStatus,
          offerPrice: test.offerPrice,
          isPopular: test.isPopular,
          isFastingRequired: test.isFastingRequired,
          fastingHours: test.fastingHours,
          recommendedFor: test.recommendedFor,
          recommendedAge: test.recommendedAge,
          branchUserIds: test.branchUsers.map((b) => b.userId),
          // Carried through deliberately: the API treats an omitted
          // `parameters` as "leave attachments alone", but being explicit here
          // means a future change to that default can't silently detach a
          // test's analytes on an Active toggle.
          parameters: test.parameters.map((p) => ({ parameterId: p.parameterId })),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `${test.name} marked as ${nextStatus === "Active" ? "active" : "inactive"}.`,
          );
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
    deleteTest.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete test.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<LabTest>[] = [
    {
      key: "serialNo",
      header: "S.No",
      render: (t) => <span className="text-muted-foreground tabular-nums">{t.serialNo}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.name}</span>
          <span className="text-xs text-muted-foreground">{t.shortName}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (t) => (
        <div className="flex flex-col">
          <span className="tabular-nums">{formatCurrency(t.price)}</span>
          {t.offerPrice != null && (
            <span className="text-xs text-success tabular-nums">
              Offer: {formatCurrency(t.offerPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "parameters",
      header: "Parameters",
      render: (t) =>
        t.parameterCount === 0 ? (
          <Badge variant="outline" className="whitespace-nowrap">
            Free text
          </Badge>
        ) : (
          <Badge variant="secondary" className="tabular-nums">
            {t.parameterCount}
          </Badge>
        ),
    },
    { key: "sample", header: "Sample Type", render: (t) => t.sampleType },
    { key: "tat", header: "Report Time", render: (t) => t.reportTime },
    {
      key: "category",
      header: "Category",
      render: (t) =>
        t.appCategory ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {t.appCategory}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "branches",
      header: "Branches",
      render: (t) =>
        t.branchUsers.length === 0 ? (
          <Badge variant="secondary" className="whitespace-nowrap">
            All branches
          </Badge>
        ) : (
          <Badge variant="outline" className="tabular-nums">
            {t.branchUsers.length} branch{t.branchUsers.length === 1 ? "" : "es"}
          </Badge>
        ),
    },
    {
      key: "popularity",
      header: "Popularity",
      render: (t) => (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="w-fit tabular-nums">
            {formatNumber(t.bookedCount)} orders
          </Badge>
          {t.isPopular && <Badge className="w-fit">Popular</Badge>}
        </div>
      ),
    },
    {
      key: "sortOrder",
      header: "Sort Order",
      render: (t) => <span className="tabular-nums text-foreground">{t.sortOrder}</span>,
    },
    {
      key: "active",
      header: "Active",
      render: (t) => (
        <Switch checked={t.status === "Active"} onCheckedChange={() => handleToggleActive(t)} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Preview what the patient app shows"
            onClick={() => setPreviewTestId(t.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setEditingTest(t);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(t)}
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
            placeholder="Search by name or short name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={appCategoryId} onValueChange={setAppCategoryId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {appCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
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
                    toast.error(err instanceof Error ? err.message : "Failed to export tests.");
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
                setEditingTest(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Test
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
          icon={FlaskConical}
          title="Couldn't load tests"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No tests found"
          description="Try adjusting your search or filters, or add a new test."
          action={
            <Button
              onClick={() => {
                setEditingTest(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Test
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={tests} rowKey={(t) => t.id} pageSize={10} />
      )}

      <TestFormDialog open={formOpen} onOpenChange={setFormOpen} test={editingTest} />

      <TestDetailDialog
        testId={previewTestId}
        onOpenChange={(open) => !open && setPreviewTestId(null)}
      />

      <ImportResultDialog result={importResult} onClose={() => setImportResult(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete test?"
        description={`This will permanently remove "${deleteTarget?.name}" from the catalog. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { TestsTab };
