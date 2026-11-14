import { useEffect, useMemo, useRef, useState } from "react";
import { Beaker, Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
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
  useDeleteParameter,
  useExportParametersCsv,
  useImportParametersCsv,
  useParameters,
  useUpdateParameter,
} from "@/hooks/queries/useParameters";
import type { CsvImportResult } from "@/services/api/csvImport.types";
import { SAMPLE_COLLECTION_LABELS, type ParameterDto } from "@/services/api/parameterApi";

import { BookableBadge } from "./BookableBadge";
import { ParameterFormDialog } from "./ParameterFormDialog";

function ParametersTab() {
  const [search, setSearch] = useState("");
  const [doTestFilter, setDoTestFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<ParameterDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParameterDto | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Server-side paging: the backend caps pageSize at 500 but the catalogue can
  // hold more parameters than that, so the list pages through the server rather
  // than pulling everything into one client-side table.
  const PAGE_SIZE = 20;

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      doTest: doTestFilter === "all" ? undefined : (doTestFilter as "true" | "false"),
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, doTestFilter, page],
  );

  // A changed search/filter re-scopes the result set, so jump back to page 1.
  useEffect(() => {
    setPage(1);
  }, [search, doTestFilter]);

  const { data, isLoading, isError, error } = useParameters(queryParams);
  const parameters = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateParameter = useUpdateParameter();
  const deleteParameter = useDeleteParameter();
  const exportCsv = useExportParametersCsv();
  const importCsv = useImportParametersCsv();

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    importCsv.mutate(file, {
      onSuccess: (result) => setImportResult(result),
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to import parameters.");
      },
    });
  }

  /** The list's inline toggles reuse the full update payload — the API validates
   *  the whole row on write, same convention as `TestsTab`'s status switch. */
  function handleToggle(parameter: ParameterDto, patch: Partial<ParameterDto>) {
    updateParameter.mutate(
      {
        id: parameter.id,
        values: {
          name: parameter.name,
          shortName: parameter.shortName,
          price: parameter.price,
          offerPrice: parameter.offerPrice,
          doTest: parameter.doTest,
          isCommonlyUsed: parameter.isCommonlyUsed,
          sampleTypeId: parameter.sampleTypeId,
          appCategoryId: parameter.appCategoryId,
          reportTime: parameter.reportTime,
          sampleCollection: parameter.sampleCollection,
          isFastingRequired: parameter.isFastingRequired,
          fastingHours: parameter.fastingHours,
          recommendedFor: parameter.recommendedFor,
          recommendedAge: parameter.recommendedAge,
          description: parameter.description,
          active: parameter.active,
          ...patch,
        },
      },
      {
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update parameter.");
        },
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteParameter.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete parameter.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<ParameterDto>[] = [
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
          <span className="text-xs text-muted-foreground">{p.shortName}</span>
        </div>
      ),
    },
    {
      key: "sampleType",
      header: "Sample Type",
      render: (p) => p.sampleType ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (p) =>
        p.appCategory ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {p.appCategory}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "reportTime",
      header: "Report Time",
      render: (p) => (
        <div className="flex flex-col gap-0.5">
          <span>{p.reportTime ?? "—"}</span>
          <span className="text-xs text-muted-foreground">
            {SAMPLE_COLLECTION_LABELS[p.sampleCollection]}
            {p.isFastingRequired && ` · fasting${p.fastingHours ? ` ${p.fastingHours}h` : ""}`}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      header: "MRP",
      render: (p) => (
        <div className="flex flex-col">
          <span className="tabular-nums">{formatCurrency(p.price)}</span>
          {p.offerPrice != null && (
            <span className="text-xs text-success tabular-nums">
              Offer: {formatCurrency(p.offerPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "doTest",
      header: "Do Test",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={p.doTest}
            onCheckedChange={(v) =>
              // Commonly Used only means anything alongside Do Test — same
              // consistency rule the form dialog enforces, applied here too
              // so turning this off can't leave a combination the server
              // rejects.
              handleToggle(p, { doTest: v, isCommonlyUsed: v ? p.isCommonlyUsed : false })
            }
            aria-label="Bookable on its own"
          />
          <BookableBadge bookable={p.doTest} compact />
        </div>
      ),
    },
    {
      key: "commonlyUsed",
      header: "Commonly Used",
      render: (p) =>
        p.doTest ? (
          <Switch
            checked={p.isCommonlyUsed}
            onCheckedChange={(v) => handleToggle(p, { isCommonlyUsed: v })}
            aria-label="Show in patient app's Tests browse"
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "usage",
      header: "Used By",
      render: (p) => (
        <Badge variant={p.testCount > 0 ? "secondary" : "outline"} className="tabular-nums">
          {p.testCount} test{p.testCount === 1 ? "" : "s"}
        </Badge>
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
      render: (p) => (
        <Switch checked={p.active} onCheckedChange={(v) => handleToggle(p, { active: v })} />
      ),
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
            onClick={() => {
              setEditingParameter(p);
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Loading parameters…"
          ) : (
            <>
              <span className="text-base font-semibold text-foreground">{formatNumber(total)}</span>{" "}
              total parameter{total === 1 ? "" : "s"}
            </>
          )}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            placeholder="Search by name or short name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={doTestFilter} onValueChange={setDoTestFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Bookability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parameters</SelectItem>
              <SelectItem value="true">Bookable on their own</SelectItem>
              <SelectItem value="false">Part of a test only</SelectItem>
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
                    toast.error(
                      err instanceof Error ? err.message : "Failed to export parameters.",
                    );
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
                setEditingParameter(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Parameter
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
          icon={Beaker}
          title="Couldn't load parameters"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : parameters.length === 0 ? (
        <EmptyState
          icon={Beaker}
          title="No parameters found"
          description="Try adjusting your search or filters, or add a new analyte."
          action={
            <Button
              onClick={() => {
                setEditingParameter(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Parameter
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={parameters}
            rowKey={(p) => p.id}
            pageSize={PAGE_SIZE}
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

      <ParameterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        parameter={editingParameter}
      />

      <ImportResultDialog result={importResult} onClose={() => setImportResult(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete parameter?"
        description={
          deleteTarget && deleteTarget.testCount > 0
            ? `"${deleteTarget.name}" is reported by ${deleteTarget.testCount} test${deleteTarget.testCount === 1 ? "" : "s"}. Detach it there first, or turn Active off to retire it instead.`
            : `This will permanently remove "${deleteTarget?.name}". This action cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { ParametersTab };
