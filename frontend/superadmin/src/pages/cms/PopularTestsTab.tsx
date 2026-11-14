import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Trash2 } from "lucide-react";
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
import { useSetTestPopular, useTests } from "@/hooks/queries/useTests";

function PopularTestsTab() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data, isLoading, isError, error } = useTests({
    status: "Active",
    page: 1,
    pageSize: 100,
  });
  const tests = useMemo(() => data?.rows ?? [], [data]);
  const popular = useMemo(() => tests.filter((t) => t.isPopular), [tests]);
  const eligible = useMemo(() => tests.filter((t) => !t.isPopular), [tests]);

  const setPopular = useSetTestPopular();

  function handleAdd() {
    if (!selectedId) return;
    const test = tests.find((t) => t.id === selectedId);
    setPopular.mutate(
      { id: selectedId, isPopular: true },
      {
        onSuccess: () => {
          toast.success(`"${test?.name}" added to Popular Tests`);
          setSelectedId("");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add test."),
      },
    );
  }

  function handleRemove(id: string, name: string) {
    setPopular.mutate(
      { id, isPopular: false },
      {
        onSuccess: () => toast.success(`"${name}" removed from Popular Tests`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to remove test."),
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
        icon={FlaskConical}
        title="Couldn't load tests"
        description={error instanceof Error ? error.message : "Something went wrong."}
      />
    );
  }

  if (tests.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No tests found"
        description="Create a test in Tests & Packages before featuring it here."
        action={
          <Button onClick={() => navigate("/tests-packages")} variant="outline" size="sm">
            <FlaskConical className="size-3.5" />
            Add Test
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
              <SelectValue placeholder="Select a test to feature on Home..." />
            </SelectTrigger>
            <SelectContent>
              {eligible.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  All tests are already featured.
                </div>
              ) : (
                eligible.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedId || setPopular.isPending}>
            <FlaskConical className="size-4" />
            Add to Popular
          </Button>
        </CardContent>
      </Card>

      {popular.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No popular tests yet"
          description="Pick a test from the dropdown above — it'll appear in the patient app Home screen's Popular Tests section."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {popular.map((test) => (
            <div
              key={test.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">{test.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(test.offerPrice ?? test.price)}
                  {test.offerPrice != null && test.offerPrice !== test.price && (
                    <span className="ml-1.5 line-through opacity-60">
                      {formatCurrency(test.price)}
                    </span>
                  )}
                  {" · "}
                  {test.parameterCount} parameters · {test.bookedCount} booked
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-center"
                onClick={() => handleRemove(test.id, test.name)}
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

export { PopularTestsTab };
