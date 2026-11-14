import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { usePackages, useSetPackagePopular } from "@/hooks/queries/usePackages";

function PopularPackagesTab() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data, isLoading, isError, error } = usePackages({
    active: true,
    page: 1,
    pageSize: 100,
  });
  const packages = useMemo(() => data?.rows ?? [], [data]);
  const popular = useMemo(() => packages.filter((p) => p.isPopular), [packages]);
  const eligible = useMemo(() => packages.filter((p) => !p.isPopular), [packages]);

  const setPopular = useSetPackagePopular();

  function handleAdd() {
    if (!selectedId) return;
    const pkg = packages.find((p) => p.id === selectedId);
    setPopular.mutate(
      { id: selectedId, isPopular: true },
      {
        onSuccess: () => {
          toast.success(`"${pkg?.name}" added to Popular Packages`);
          setSelectedId("");
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to add package."),
      },
    );
  }

  function handleRemove(id: string, name: string) {
    setPopular.mutate(
      { id, isPopular: false },
      {
        onSuccess: () => toast.success(`"${name}" removed from Popular Packages`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to remove package."),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={PackagePlus}
        title="Couldn't load packages"
        description={error instanceof Error ? error.message : "Something went wrong."}
      />
    );
  }

  if (packages.length === 0) {
    return (
      <EmptyState
        icon={PackagePlus}
        title="No packages found"
        description="Create a package in Tests & Packages before featuring it here."
        action={
          <Button onClick={() => navigate("/tests-packages")} variant="outline" size="sm">
            <PackagePlus className="size-3.5" />
            Add Package
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="min-w-64 flex-1">
              <SelectValue placeholder="Select a package to feature on Home..." />
            </SelectTrigger>
            <SelectContent>
              {eligible.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  All packages are already featured.
                </div>
              ) : (
                eligible.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedId || setPopular.isPending}>
            <PackagePlus className="size-4" />
            Add to Popular
          </Button>
        </CardContent>
      </Card>

      {popular.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="No popular packages yet"
          description="Pick a package from the dropdown above — it'll appear in the patient app Home screen's Popular Packages section."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {popular.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">{pkg.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(pkg.offerPrice ?? pkg.price)}
                  {pkg.offerPrice != null && pkg.offerPrice !== pkg.price && (
                    <span className="ml-1.5 line-through opacity-60">
                      {formatCurrency(pkg.price)}
                    </span>
                  )}
                  {" · "}
                  {pkg.testCount} tests · {pkg.bookedCount} booked
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-center"
                onClick={() => handleRemove(pkg.id, pkg.name)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { PopularPackagesTab };
