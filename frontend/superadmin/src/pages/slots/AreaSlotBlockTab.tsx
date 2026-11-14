import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Ban, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { useAreas } from "@/hooks/queries/useAreas";
import {
  useAreaSlotBlocks,
  useCreateAreaSlotBlocksBulk,
  useDeleteAreaSlotBlocksBulk,
} from "@/hooks/queries/useAreaSlotBlocks";
import { useCities, useCitySlotConfig } from "@/hooks/queries/useCitySlotConfig";
import type { AreaSlotBlockDto } from "@/services/api/areaSlotBlockApi";

const TODAY = format(new Date(), "yyyy-MM-dd");
const DEFAULT_TO = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

interface AddFormState {
  cityId: string;
  areaId: string;
  slotTemplateIds: string[];
  blockDate: string;
  reason: string;
}

function emptyAddForm(cityId?: string, areaId?: string): AddFormState {
  return {
    cityId: cityId ?? "",
    areaId: areaId ?? "",
    slotTemplateIds: [],
    blockDate: TODAY,
    reason: "",
  };
}

function AreaSlotBlockTab() {
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [areaId, setAreaId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState(TODAY);
  const [dateTo, setDateTo] = useState(DEFAULT_TO);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const areasQuery = useAreas({ cityId, isActive: true, pageSize: 200 });
  const areas = useMemo(() => areasQuery.data?.rows ?? [], [areasQuery.data]);

  const { data, isLoading, isError, error } = useAreaSlotBlocks({ areaId, dateFrom, dateTo });
  const blocks = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.blockDate.localeCompare(b.blockDate)),
    [data],
  );

  useEffect(() => {
    setSelectedIds([]);
  }, [areaId, dateFrom, dateTo]);

  const deleteBlocksBulk = useDeleteAreaSlotBlocksBulk();

  const allSelected = blocks.length > 0 && selectedIds.length === blocks.length;

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? blocks.map((b) => b.id) : []);
  }

  function handleCityChange(next: string) {
    setCityId(next);
    setAreaId(undefined);
  }

  function handleBulkUnblock() {
    deleteBlocksBulk.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(
          selectedIds.length === 1
            ? "Area slot unblocked."
            : `${selectedIds.length} area slots unblocked.`,
        );
        setSelectedIds([]);
        setBulkConfirmOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to unblock area slots.");
        setBulkConfirmOpen(false);
      },
    });
  }

  function handleUnblockOne(block: AreaSlotBlockDto) {
    deleteBlocksBulk.mutate([block.id], {
      onSuccess: () => toast.success("Area slot unblocked."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to unblock area slot."),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label>City</Label>
            <Select value={cityId} onValueChange={handleCityChange}>
              <SelectTrigger className="w-52">
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
            <Label>Area</Label>
            <Select value={areaId} onValueChange={setAreaId} disabled={!cityId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder={cityId ? "Select an area" : "Select a city first"} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
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
            Block Area Slots
          </Button>
        </CardContent>
      </Card>

      {!areaId ? (
        <EmptyState
          icon={Ban}
          title="Select a city and area"
          description="Choose a city and area above to view and manage its slot blocks."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Ban}
          title="Couldn't load area slot blocks"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : blocks.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="No area slot blocks in this range"
          description="Nothing is blocked for this area and date range."
          action={
            <Button onClick={() => setFormOpen(true)} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Block Area Slots
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
                  {block.areaName}
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

      <AreaSlotBlockFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cities={cities}
        defaultCityId={cityId}
        defaultAreaId={areaId}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={`Unblock ${selectedIds.length} area slot${selectedIds.length === 1 ? "" : "s"}?`}
        description="These slots will become bookable again for their respective dates in this area."
        confirmLabel="Unblock"
        destructive
        onConfirm={handleBulkUnblock}
      />
    </div>
  );
}

interface AreaSlotBlockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: Array<{ id: string; name: string }>;
  defaultCityId?: string;
  defaultAreaId?: string;
}

function AreaSlotBlockFormDialog({
  open,
  onOpenChange,
  cities,
  defaultCityId,
  defaultAreaId,
}: AreaSlotBlockFormDialogProps) {
  const [form, setForm] = useState<AddFormState>(emptyAddForm(defaultCityId, defaultAreaId));

  useEffect(() => {
    if (open) setForm(emptyAddForm(defaultCityId, defaultAreaId));
  }, [open, defaultCityId, defaultAreaId]);

  const areasQuery = useAreas({ cityId: form.cityId || undefined, isActive: true, pageSize: 200 });
  const areas = useMemo(() => areasQuery.data?.rows ?? [], [areasQuery.data]);

  const configQuery = useCitySlotConfig(form.cityId || undefined);
  const templates = (configQuery.data?.templates ?? []).filter((t) => t.active);

  const createBlocksBulk = useCreateAreaSlotBlocksBulk();

  function handleCityChange(cityId: string) {
    setForm((f) => ({ ...f, cityId, areaId: "", slotTemplateIds: [] }));
  }

  function toggleTemplate(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      slotTemplateIds: checked
        ? [...f.slotTemplateIds, id]
        : f.slotTemplateIds.filter((t) => t !== id),
    }));
  }

  function toggleAll(checked: boolean) {
    setForm((f) => ({
      ...f,
      slotTemplateIds: checked ? templates.map((t) => t.slotTemplateId) : [],
    }));
  }

  function handleSubmit() {
    if (!form.areaId || form.slotTemplateIds.length === 0 || !form.blockDate) {
      toast.error("Area, at least one slot template, and date are required.");
      return;
    }

    createBlocksBulk.mutate(
      {
        areaId: form.areaId,
        slotTemplateIds: form.slotTemplateIds,
        blockDate: form.blockDate,
        reason: form.reason.trim() || null,
      },
      {
        onSuccess: (blocks) => {
          toast.success(
            blocks.length === 1 ? "Area slot blocked." : `${blocks.length} area slots blocked.`,
          );
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to block area slots.");
        },
      },
    );
  }

  const allSelected = templates.length > 0 && form.slotTemplateIds.length === templates.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Block Area Slots</DialogTitle>
          <DialogDescription>
            Block one or more slot templates for a single area on a specific date, without affecting
            the rest of the city.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area-block-city">City *</Label>
            <Select value={form.cityId || undefined} onValueChange={handleCityChange}>
              <SelectTrigger id="area-block-city">
                <SelectValue placeholder="Select city" />
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
            <Label htmlFor="area-block-area">Area *</Label>
            <Select
              value={form.areaId || undefined}
              onValueChange={(areaId) => setForm((f) => ({ ...f, areaId }))}
              disabled={!form.cityId}
            >
              <SelectTrigger id="area-block-area">
                <SelectValue placeholder={form.cityId ? "Select area" : "Select a city first"} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Slot Templates *</Label>
              {templates.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => toggleAll(!allSelected)}
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              )}
            </div>
            {!form.cityId ? (
              <p className="text-xs text-muted-foreground">Select a city first.</p>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No slot templates assigned to this city yet.
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {templates.map((t) => (
                  <label
                    key={t.slotTemplateId}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/40"
                  >
                    <Checkbox
                      checked={form.slotTemplateIds.includes(t.slotTemplateId)}
                      onCheckedChange={(checked) =>
                        toggleTemplate(t.slotTemplateId, checked === true)
                      }
                    />
                    <span className="flex-1 text-foreground">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.startTime} - {t.endTime}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area-block-date">Date *</Label>
            <Input
              id="area-block-date"
              type="date"
              value={form.blockDate}
              onChange={(e) => setForm((f) => ({ ...f, blockDate: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area-block-reason">Reason</Label>
            <Textarea
              id="area-block-reason"
              placeholder="e.g. Local event"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createBlocksBulk.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createBlocksBulk.isPending}>
            {createBlocksBulk.isPending
              ? "Blocking..."
              : form.slotTemplateIds.length > 1
                ? `Block ${form.slotTemplateIds.length} Slots`
                : "Block Area Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AreaSlotBlockTab };
