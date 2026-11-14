import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPinned, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
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
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useAreas, useDeleteArea, useSetAreaStatus } from "@/hooks/queries/useAreas";
import { formatNumber } from "@/lib/format";
import { usePhlebotomists } from "@/hooks/queries/usePhlebotomists";
import type { AreaDto } from "@/services/api/areaApi";

import { AreaFormDialog } from "./AreaFormDialog";

type ActiveFilter = "all" | "active" | "inactive";

/** Rows per request. Areas are server-paginated: the network has ~1,800 of
 *  them, so fetching "the first page and paginating it in the browser" quietly
 *  hid everything past the first slice — including most of any one city's
 *  areas, which made large cities look almost empty. */
const PAGE_SIZE = 20;

function AreasTab() {
  const navigate = useNavigate();
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AreaDto | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Any filter change re-shapes the result set, so page 7 of the old one is
  // meaningless — and often past the end of the new one.
  useEffect(() => {
    setPage(1);
  }, [cityFilter, search, activeFilter]);

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const { data, isLoading, isError, error } = useAreas({
    cityId: cityFilter === "all" ? undefined : cityFilter,
    search: search || undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    page,
    pageSize: PAGE_SIZE,
  });
  const areas = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Real coverage — active phlebotomists whose serviceAreas include this
  // area, same PhlebotomistServiceArea join the Slot Availability engine
  // itself reads (see slotAvailability.service.ts) — not a mock count.
  const phlebosQuery = usePhlebotomists();
  const phlebosByAreaId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const phlebo of phlebosQuery.data ?? []) {
      for (const area of phlebo.serviceAreas) {
        map.set(area.id, [...(map.get(area.id) ?? []), phlebo.name]);
      }
    }
    return map;
  }, [phlebosQuery.data]);

  const setStatus = useSetAreaStatus();
  const deleteArea = useDeleteArea();

  function openAddDialog() {
    setEditingArea(null);
    setFormOpen(true);
  }

  function openEditDialog(area: AreaDto) {
    setEditingArea(area);
    setFormOpen(true);
  }

  function handleToggleActive(area: AreaDto, isActive: boolean) {
    setStatus.mutate(
      { id: area.id, isActive },
      {
        onSuccess: () =>
          toast.success(
            isActive ? `"${area.name}" is now active` : `"${area.name}" was deactivated`,
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update area status."),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteArea.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Area "${target.name}" was deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete area.");
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<AreaDto>[] = [
    {
      key: "name",
      header: "Area Name",
      render: (a) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{a.name}</span>
          <span className="text-xs text-muted-foreground">{a.cityName}</span>
        </div>
      ),
    },
    {
      key: "pincodes",
      header: "Pincodes",
      render: (a) => (
        <span className="text-xs text-muted-foreground">
          {a.pincodes.length > 0 ? a.pincodes.join(", ") : "—"}
        </span>
      ),
    },
    {
      key: "phlebos",
      header: "Assigned Phlebos",
      render: (a) => {
        const names = phlebosByAreaId.get(a.id) ?? [];
        return names.length === 0 ? (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => navigate("/phlebos")}
          >
            None assigned
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-1" title={names.join(", ")}>
            <Badge variant="secondary">{names.length}</Badge>
            <span className="max-w-40 truncate text-xs text-muted-foreground">
              {names.join(", ")}
            </span>
          </div>
        );
      },
    },
    {
      key: "active",
      header: "Active",
      render: (a) => (
        <Switch
          checked={a.isActive}
          onCheckedChange={(checked) => handleToggleActive(a, checked)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-24",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(a)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(a)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Assign a phlebotomist to an area from the{" "}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => navigate("/phlebos")}
        >
          Phlebotomists
        </Button>{" "}
        page — coverage there drives real booking capacity and slot availability for the matching
        area/pincode.
      </p>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by area name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add Area
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
          icon={MapPinned}
          title="Couldn't load areas"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : areas.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No areas found"
          description="Try adjusting your search or filters, or add a new area."
          action={
            <Button onClick={openAddDialog} variant="outline" size="sm">
              <Plus className="size-3.5" />
              Add Area
            </Button>
          }
        />
      ) : (
        <>
          {/* pageSize matches the fetch size so DataTable renders the server's
              page as-is instead of re-paginating it. */}
          <DataTable columns={columns} data={areas} rowKey={(a) => a.id} pageSize={PAGE_SIZE} />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of{" "}
              {formatNumber(total)}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
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
          </div>
        </>
      )}

      <AreaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cities={cities}
        area={editingArea}
        defaultCityId={cityFilter !== "all" ? cityFilter : undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete area?"
        description={`"${deleteTarget?.name ?? ""}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

export { AreasTab };
