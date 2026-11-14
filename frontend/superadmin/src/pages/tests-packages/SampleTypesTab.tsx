import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, TestTube, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import type { DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSampleTypes } from "@/hooks/queries/useMasterData";
import {
  useDeleteSampleType,
  useSampleTypeBarcodeConfigs,
  useSetSampleTypeStatus,
} from "@/hooks/queries/useSampleTypes";
import { useTests } from "@/hooks/queries/useTests";
import type { SampleTypeDto } from "@/services/api/sampleTypeApi";

import { SampleTypeFormDialog } from "./SampleTypeFormDialog";

function SampleTypesTab() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSampleType, setEditingSampleType] = useState<SampleTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SampleTypeDto | null>(null);

  const { data, isLoading, isError, error } = useSampleTypes();
  const { data: barcodeConfigs } = useSampleTypeBarcodeConfigs();

  // The catalogue is small enough to count usage client-side, which avoids adding
  // a dedicated aggregate endpoint just to render one column. The delete guard
  // itself is enforced server-side regardless (see `sampleType.service.ts`).
  const { data: testsResult } = useTests({ page: 1, pageSize: 500 });
  const testCountBySampleTypeId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const test of testsResult?.rows ?? []) {
      counts.set(test.sampleTypeId, (counts.get(test.sampleTypeId) ?? 0) + 1);
    }
    return counts;
  }, [testsResult]);

  const barcodeBySampleTypeId = useMemo(() => {
    const map = new Map<string, { prefix: string | null; numberLength: number }>();
    for (const config of barcodeConfigs?.rows ?? []) {
      map.set(config.sampleTypeId, {
        prefix: config.prefix,
        numberLength: config.numberLength,
      });
    }
    return map;
  }, [barcodeConfigs]);

  const sampleTypes = useMemo(() => {
    const rows = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const setStatus = useSetSampleTypeStatus();
  const deleteSampleType = useDeleteSampleType();

  function handleToggleActive(sampleType: SampleTypeDto) {
    setStatus.mutate(
      { id: sampleType.id, active: !sampleType.active },
      {
        onSuccess: () => {
          toast.success(
            `${sampleType.name} marked as ${!sampleType.active ? "active" : "inactive"}.`,
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
    deleteSampleType.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} deleted.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        // The server refuses a type still used by a test or a collected sample
        // and explains why — surface that message rather than a generic failure.
        toast.error(err instanceof Error ? err.message : "Failed to delete sample type.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<SampleTypeDto>[] = [
    {
      key: "name",
      header: "Name",
      render: (s) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{s.name}</span>
          {s.description && (
            <span className="max-w-72 truncate text-xs text-muted-foreground">{s.description}</span>
          )}
        </div>
      ),
    },
    {
      key: "barcode",
      header: "Barcode",
      render: (s) => {
        const config = barcodeBySampleTypeId.get(s.id);
        if (!config?.prefix) {
          return (
            <Badge variant="outline" className="w-fit gap-1 whitespace-nowrap text-warning">
              <AlertTriangle className="size-3" />
              Not set
            </Badge>
          );
        }
        return (
          <span className="font-mono text-xs tabular-nums">
            {config.prefix}
            {"0".repeat(Math.max(config.numberLength - 1, 0))}1
          </span>
        );
      },
    },
    {
      key: "usage",
      header: "Used By",
      render: (s) => {
        const count = testCountBySampleTypeId.get(s.id) ?? 0;
        return (
          <Badge variant={count > 0 ? "secondary" : "outline"} className="tabular-nums">
            {count} test{count === 1 ? "" : "s"}
          </Badge>
        );
      },
    },
    {
      key: "active",
      header: "Active",
      render: (s) => <Switch checked={s.active} onCheckedChange={() => handleToggleActive(s)} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setEditingSampleType(s);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(s)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const missingBarcodeCount = (data?.rows ?? []).filter(
    (s) => !barcodeBySampleTypeId.get(s.id)?.prefix,
  ).length;

  const editingBarcode = editingSampleType
    ? barcodeBySampleTypeId.get(editingSampleType.id)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            placeholder="Search sample types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setEditingSampleType(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Sample Type
            </Button>
          </div>
        </CardContent>
      </Card>

      {missingBarcodeCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {missingBarcodeCount} sample type{missingBarcodeCount === 1 ? "" : "s"} ha
            {missingBarcodeCount === 1 ? "s" : "ve"} no barcode prefix. Samples of th
            {missingBarcodeCount === 1 ? "at type" : "ose types"} can't be collected until one is
            set — edit the row to add it.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={TestTube}
          title="Couldn't load sample types"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : sampleTypes.length === 0 ? (
        <EmptyState
          icon={TestTube}
          title="No sample types found"
          description="Try adjusting your search, or add a new specimen type."
          action={
            <Button
              onClick={() => {
                setEditingSampleType(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add Sample Type
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={sampleTypes} rowKey={(s) => s.id} pageSize={10} />
      )}

      <SampleTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sampleType={editingSampleType}
        barcodePrefix={editingBarcode?.prefix ?? null}
        barcodeNumberLength={editingBarcode?.numberLength ?? 6}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete sample type?"
        description={(() => {
          if (!deleteTarget) return "";
          const count = testCountBySampleTypeId.get(deleteTarget.id) ?? 0;
          return count > 0
            ? `"${deleteTarget.name}" is used by ${count} test${count === 1 ? "" : "s"}. Move ${count === 1 ? "it" : "them"} to another sample type first, or turn Active off to retire it instead.`
            : `This will remove "${deleteTarget.name}" from the sample type list.`;
        })()}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { SampleTypesTab };
