import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Ban, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useDeleteSlotBlocksBulk, useSlotBlocks } from "@/hooks/queries/useSlotBlocks";
import type { SlotBlockDto } from "@/services/api/slotBlockApi";

import { BlockSlotFormDialog } from "./BlockSlotFormDialog";

const TODAY = format(new Date(), "yyyy-MM-dd");
const DEFAULT_TO = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

function DailySlotBlockTab() {
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState(TODAY);
  const [dateTo, setDateTo] = useState(DEFAULT_TO);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const { data, isLoading, isError, error } = useSlotBlocks({ cityId, dateFrom, dateTo });
  const blocks = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.blockDate.localeCompare(b.blockDate)),
    [data],
  );

  useEffect(() => {
    setSelectedIds([]);
  }, [cityId, dateFrom, dateTo]);

  const deleteBlocksBulk = useDeleteSlotBlocksBulk();

  const allSelected = blocks.length > 0 && selectedIds.length === blocks.length;

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? blocks.map((b) => b.id) : []);
  }

  function handleBulkUnblock() {
    deleteBlocksBulk.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(
          selectedIds.length === 1 ? "Slot unblocked." : `${selectedIds.length} slots unblocked.`,
        );
        setSelectedIds([]);
        setBulkConfirmOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to unblock slots.");
        setBulkConfirmOpen(false);
      },
    });
  }

  function handleUnblockOne(block: SlotBlockDto) {
    deleteBlocksBulk.mutate([block.id], {
      onSuccess: () => toast.success("Slot unblocked."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to unblock slot."),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label>City</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button className="ml-auto" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Block Slots
          </Button>
        </CardContent>
      </Card>

      {!cityId ? (
        <EmptyState
          icon={Ban}
          title="Select a city"
          description="Choose a city above to view and manage its manual slot blocks."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Ban}
          title="Couldn't load slot blocks"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : blocks.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="No slot blocks in this range"
          description="Nothing is manually blocked for this city and date range."
          action={
            <Button onClick={() => setFormOpen(true)} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Block Slots
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-1">
            <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(c === true)} />
            <span className="text-xs text-muted-foreground">
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
            </span>
            {selectedIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => setBulkConfirmOpen(true)}
              >
                <Trash2 className="size-3.5" />
                Unblock Selected ({selectedIds.length})
              </Button>
            )}
          </div>

          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
            >
              <Checkbox
                checked={selectedIds.includes(block.id)}
                onCheckedChange={(checked) => toggleOne(block.id, checked === true)}
              />
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Ban className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {block.slotTemplateTitle} — {formatDate(block.blockDate)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {block.cityName}
                  {block.reason ? ` · ${block.reason}` : ""}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleUnblockOne(block)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <BlockSlotFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cities={cities}
        defaultCityId={cityId}
        defaultDate={TODAY}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={`Unblock ${selectedIds.length} slot${selectedIds.length === 1 ? "" : "s"}?`}
        description="These slots will become bookable again for their respective dates."
        confirmLabel="Unblock"
        destructive
        onConfirm={handleBulkUnblock}
      />
    </div>
  );
}

export { DailySlotBlockTab };
