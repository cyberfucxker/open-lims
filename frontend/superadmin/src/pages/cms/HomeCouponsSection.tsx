import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, Sparkles, Trash2 } from "lucide-react";
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
import {
  useCoupons,
  useReorderHomeCoupons,
  useSetCouponHomeFeature,
} from "@/hooks/queries/useCoupons";
import type { Coupon } from "@/services/api/couponApi";
import { cn } from "@/utils/cn";

function formatDiscount(coupon: Coupon) {
  return coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}% off`
    : `₹${coupon.discountValue} off`;
}

function HomeCouponsSection() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data, isLoading } = useCoupons({ page: 1, pageSize: 100 });
  const coupons = useMemo(() => data?.rows ?? [], [data]);

  const featured = useMemo(
    () => coupons.filter((c) => c.showOnHome).sort((a, b) => a.homeSortOrder - b.homeSortOrder),
    [coupons],
  );
  const eligible = useMemo(() => coupons.filter((c) => !c.showOnHome && c.isActive), [coupons]);

  const setHomeFeature = useSetCouponHomeFeature();
  const reorder = useReorderHomeCoupons();

  function handleAdd() {
    if (!selectedId) return;
    const coupon = coupons.find((c) => c.id === selectedId);
    setHomeFeature.mutate(
      { id: selectedId, showOnHome: true },
      {
        onSuccess: () => {
          toast.success(`"${coupon?.code}" featured on Home`);
          setSelectedId("");
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to feature coupon."),
      },
    );
  }

  function handleRemove(coupon: Coupon) {
    setHomeFeature.mutate(
      { id: coupon.id, showOnHome: false },
      {
        onSuccess: () => toast.success(`"${coupon.code}" removed from Home`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to remove coupon."),
      },
    );
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...featured];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorder.mutate(
      reordered.map((c) => c.id),
      {
        onSuccess: () => toast.success("Home coupon order updated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to reorder coupons."),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/20 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Popular Coupons (Home Screen)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Pick which active coupons appear in the Example Lab patient app's Home screen. Drag to reorder.
      </p>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="min-w-64 flex-1">
              <SelectValue placeholder="Select a coupon to feature on Home..." />
            </SelectTrigger>
            <SelectContent>
              {eligible.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No more active coupons to feature.
                </div>
              ) : (
                eligible.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedId || setHomeFeature.isPending}>
            Add to Home
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-14 w-full rounded-2xl" />
      ) : featured.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No coupons featured yet"
          description="Pick an active coupon from the dropdown above to show it on the Home screen."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {featured.map((coupon, i) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm",
                dragIndex === i && "opacity-60",
              )}
            >
              <div className="flex cursor-grab items-center text-muted-foreground active:cursor-grabbing">
                <GripVertical className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">
                  {coupon.title}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {coupon.code} · {formatDiscount(coupon)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleRemove(coupon)}
              >
                <Trash2 className="size-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export { HomeCouponsSection };
