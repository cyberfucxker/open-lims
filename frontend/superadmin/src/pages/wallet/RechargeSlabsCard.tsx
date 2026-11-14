import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gift, Loader2, Plus, Save, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useCreateRechargeOffer,
  useDeleteRechargeOffer,
  useRechargeOffers,
  useSetRechargeOfferStatus,
  useUpdateRechargeOffer,
} from "@/hooks/queries/useRechargeOffers";
import { formatCurrency } from "@/lib/format";
import type { RechargeOffer } from "@/services/api/rechargeOfferApi";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function SlabSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

interface SlabRowProps {
  offer: RechargeOffer;
  index: number;
}

function SlabRow({ offer, index }: SlabRowProps) {
  const [rechargeAmount, setRechargeAmount] = useState(offer.rechargeAmount);
  const [bonusAmount, setBonusAmount] = useState(offer.bonusAmount);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const updateMutation = useUpdateRechargeOffer();
  const statusMutation = useSetRechargeOfferStatus();
  const deleteMutation = useDeleteRechargeOffer();

  // Resync local draft with server truth after this row's own successful update
  // (or any background refetch that lands new server values), without clobbering
  // in-progress typing on unrelated re-renders.
  useEffect(() => {
    setRechargeAmount(offer.rechargeAmount);
    setBonusAmount(offer.bonusAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.updatedAt]);

  const isDirty = rechargeAmount !== offer.rechargeAmount || bonusAmount !== offer.bonusAmount;
  const creditPreview =
    (Number.isFinite(rechargeAmount) ? rechargeAmount : 0) +
    (Number.isFinite(bonusAmount) ? bonusAmount : 0);

  function handleSave() {
    updateMutation.mutate(
      { id: offer.id, values: { rechargeAmount, bonusAmount, isActive: offer.isActive } },
      {
        onSuccess: () => toast.success("Recharge slab updated successfully"),
        onError: (error) => toast.error(errorMessage(error, "Failed to update slab")),
      },
    );
  }

  function handleToggleActive(checked: boolean) {
    statusMutation.mutate(
      { id: offer.id, isActive: checked },
      {
        onSuccess: () => toast.success(checked ? "Slab activated" : "Slab deactivated"),
        onError: (error) => toast.error(errorMessage(error, "Failed to update slab status")),
      },
    );
  }

  function handleDelete() {
    setDeleteError(null);
    deleteMutation.mutate(offer.id, {
      onSuccess: () => {
        toast.success("Recharge slab deleted");
        setConfirmDeleteOpen(false);
      },
      onError: (error) => {
        setDeleteError(errorMessage(error, "Failed to delete slab"));
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Slab {index + 1}</p>
        <div className="flex items-center gap-2">
          <Badge variant={offer.isActive ? "success" : "outline"}>
            {offer.isActive ? "Active" : "Inactive"}
          </Badge>
          <Switch
            checked={offer.isActive}
            disabled={statusMutation.isPending}
            onCheckedChange={handleToggleActive}
            aria-label={offer.isActive ? "Deactivate slab" : "Activate slab"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${offer.id}-recharge`} className="text-xs">
          Recharge Amount
        </Label>
        <Input
          id={`${offer.id}-recharge`}
          type="number"
          min={0}
          value={rechargeAmount}
          onChange={(e) => setRechargeAmount(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${offer.id}-bonus`} className="text-xs">
          Bonus Amount
        </Label>
        <Input
          id={`${offer.id}-bonus`}
          type="number"
          min={0}
          value={bonusAmount}
          onChange={(e) => setBonusAmount(Number(e.target.value) || 0)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Recharge {formatCurrency(rechargeAmount)} get {formatCurrency(bonusAmount)} bonus &mdash;
        credits <span className="font-medium text-foreground">{formatCurrency(creditPreview)}</span>
      </p>

      {deleteError ? (
        <p className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {deleteError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-1">
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              setDeleteError(null);
              setConfirmDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this recharge slab?</AlertDialogTitle>
              <AlertDialogDescription>
                Recharge {formatCurrency(offer.rechargeAmount)} / bonus{" "}
                {formatCurrency(offer.bonusAmount)}. This cannot be undone. If this slab has already
                been used in a real recharge, deletion will be blocked &mdash; deactivate it
                instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button size="sm" onClick={handleSave} disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}

function NewSlabCard({ onDone }: { onDone: () => void }) {
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const createMutation = useCreateRechargeOffer();

  const creditPreview =
    (Number.isFinite(rechargeAmount) ? rechargeAmount : 0) +
    (Number.isFinite(bonusAmount) ? bonusAmount : 0);

  function handleCreate() {
    createMutation.mutate(
      { rechargeAmount, bonusAmount, isActive: true },
      {
        onSuccess: () => {
          toast.success("Recharge slab created successfully");
          onDone();
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to create slab")),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <p className="text-xs font-medium text-muted-foreground">New Slab</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-slab-recharge" className="text-xs">
          Recharge Amount
        </Label>
        <Input
          id="new-slab-recharge"
          type="number"
          min={0}
          autoFocus
          value={rechargeAmount}
          onChange={(e) => setRechargeAmount(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-slab-bonus" className="text-xs">
          Bonus Amount
        </Label>
        <Input
          id="new-slab-bonus"
          type="number"
          min={0}
          value={bonusAmount}
          onChange={(e) => setBonusAmount(Number(e.target.value) || 0)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Credits <span className="font-medium text-foreground">{formatCurrency(creditPreview)}</span>{" "}
        on recharge
      </p>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

function RechargeSlabsCard() {
  const { data, isLoading, error } = useRechargeOffers({});
  const [isAdding, setIsAdding] = useState(false);

  const offers = data?.rows ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet text-white shadow-sm">
            <Gift className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">Recharge Offer Slabs</CardTitle>
            <CardDescription>
              Configure bonus credit customers receive when recharging their wallet.
            </CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding || isLoading}
        >
          <Plus className="size-4" />
          Add Slab
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage(error, "Failed to load recharge slabs.")}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SlabSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {offers.map((offer, i) => (
              <SlabRow key={offer.id} offer={offer} index={i} />
            ))}
            {isAdding ? <NewSlabCard onDone={() => setIsAdding(false)} /> : null}
          </div>
        )}

        {!isLoading && !error && offers.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground">
            No recharge slabs configured yet. Click "Add Slab" to create one.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { RechargeSlabsCard };
