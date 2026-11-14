import { useState } from "react";
import { Plus, Syringe } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { useFranchisePhlebos, useSetFranchisePhleboStatus } from "@/hooks/queries/useFranchise";

import { FranchiseCreatePhleboDialog } from "./FranchiseCreatePhleboDialog";

/** A franchise's own "Phlebotomists" screen — add and manage the phlebos
 *  THIS franchise created (never an admin-created one, and never another
 *  franchise's), scoped to its own assigned service areas. This is also
 *  the pool the Orders detail drawer's assign-phlebo picker offers. */
function FranchisePhlebosPage() {
  const { data: phlebos = [], isLoading, isError, error, refetch } = useFranchisePhlebos();
  const setStatus = useSetFranchisePhleboStatus();
  const [createOpen, setCreateOpen] = useState(false);

  function handleToggle(id: string, name: string, isActive: boolean) {
    setStatus.mutate(
      { id, isActive },
      {
        onSuccess: () => toast.success(`${name} ${isActive ? "activated" : "deactivated"}`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update status"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Phlebotomists"
        description="Phlebotomists you've added, scoped to your franchise's own service areas."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Add Phlebotomist
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{error instanceof Error ? error.message : "Failed to load phlebotomists."}</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : phlebos.length === 0 ? (
        <EmptyState
          icon={Syringe}
          title="No phlebotomists yet"
          description="Add a phlebotomist to start assigning them to your orders."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Add Phlebotomist
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {phlebos.map((phlebo) => (
            <Card key={phlebo.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{phlebo.name}</span>
                    <Badge variant={phlebo.isActive ? "success" : "secondary"}>
                      {phlebo.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{phlebo.mobile}</span>
                    {phlebo.cityName && <span>{phlebo.cityName}</span>}
                    {phlebo.serviceAreas.length > 0 && (
                      <span>{phlebo.serviceAreas.map((a) => a.name).join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={phlebo.isActive}
                    disabled={setStatus.isPending}
                    onCheckedChange={(checked) => handleToggle(phlebo.id, phlebo.name, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FranchiseCreatePhleboDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export { FranchisePhlebosPage };
