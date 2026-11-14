import { useMemo, useState } from "react";
import { Building2, Map, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteState, useStates } from "@/hooks/queries/useCityMaster";
import type { StateDto } from "@/services/api/cityApi";

import { StateFormDialog } from "./StateFormDialog";

/** The State master — the list the City form's picker reads from.
 *
 *  Unlike a City, a State has no active/inactive flag: nothing in the patient
 *  app points at a state directly, so there is nothing to hide. An empty one is
 *  deleted outright; one with cities under it is refused by the backend rather
 *  than cascading, because those cities carry live addresses and bookings. */
function StatesTab() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateDto | null>(null);

  const statesQuery = useStates();
  const deleteState = useDeleteState();

  const states = useMemo(() => {
    const all = statesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (s) => s.name.toLowerCase().includes(term) || (s.code ?? "").toLowerCase().includes(term),
    );
  }, [statesQuery.data, search]);

  function handleDelete(state: StateDto) {
    if (state.cityCount > 0) {
      toast.error(`${state.name} has ${state.cityCount} city(ies) under it — move those first.`);
      return;
    }
    if (!window.confirm(`Delete ${state.name}? This cannot be undone.`)) return;

    deleteState.mutate(state.id, {
      onSuccess: () => toast.success(`${state.name} deleted.`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete."),
    });
  }

  const columns: DataTableColumn<StateDto>[] = [
    {
      key: "name",
      header: "State",
      render: (state) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Map className="size-4" />
          </div>
          <span className="font-medium text-foreground">{state.name}</span>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (state) =>
        state.code ? (
          <span className="font-mono text-xs text-muted-foreground">{state.code}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "cities",
      header: "Cities",
      render: (state) => (
        <Badge variant="outline" className="gap-1">
          <Building2 className="size-3" />
          {state.cityCount}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (state) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setEditingState(state);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive disabled:opacity-40"
            disabled={state.cityCount > 0 || deleteState.isPending}
            title={state.cityCount > 0 ? "It has cities under it" : "Delete"}
            onClick={() => handleDelete(state)}
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
          <div className="min-w-[220px] flex-1">
            <Input
              placeholder="Search by state or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setEditingState(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add State
            </Button>
          </div>
        </CardContent>
      </Card>

      {statesQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : statesQuery.isError ? (
        <EmptyState
          icon={Map}
          title="Couldn't load states"
          description={
            statesQuery.error instanceof Error ? statesQuery.error.message : "Something went wrong."
          }
        />
      ) : states.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No states found"
          description="Try a different search, or add a new state."
          action={
            <Button
              onClick={() => {
                setEditingState(null);
                setFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add State
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={states} rowKey={(row) => row.id} pageSize={20} />
      )}

      <StateFormDialog open={formOpen} onOpenChange={setFormOpen} state={editingState} />
    </div>
  );
}

export { StatesTab };
