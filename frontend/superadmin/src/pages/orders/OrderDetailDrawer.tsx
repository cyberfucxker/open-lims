import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  MapPin,
  Package as PackageIcon,
  PackageCheck,
  Phone,
  Plus,
  Stethoscope,
  TestTube2,
  Trash2,
  User,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { SidePanel } from "@/components/common/SidePanel";
import { StatusPill } from "@/components/common/StatusPill";
import {
  useAppOrder,
  useRemoveHomeVisitItem,
  useUpdateAppOrderStatus,
} from "@/hooks/queries/useAppOrders";
import { formatCurrency, formatDateTime, formatTimeRange12h } from "@/lib/format";
import type {
  AppOrderAddress,
  AppOrderItem,
  AppOrderStatus,
  AppOrderTimelineStep,
} from "@/services/api/appOrderApi";
import { cn } from "@/utils/cn";

import { AddHomeVisitItemsDialog } from "./AddHomeVisitItemsDialog";
import { BookingDate } from "@/components/common/BookingDate";

const STATUS_OPTIONS: AppOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

function timelineIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("cancel") || l.includes("reject")) return XCircle;
  if (l.includes("complete")) return PackageCheck;
  if (l.includes("collect")) return TestTube2;
  if (l.includes("reach")) return UserCheck;
  if (l.includes("confirm") || l.includes("accept")) return CheckCircle2;
  return Clock;
}

function formatAddress(address: AppOrderAddress): string {
  return [
    address.houseNo,
    address.apartment,
    address.address,
    address.landmark,
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");
}

function sortTimeline(timeline: AppOrderTimelineStep[]): AppOrderTimelineStep[] {
  return [...timeline].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

interface OrderDetailDrawerProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mirrors the backend's own `HOME_VISIT_ITEM_ADDABLE_STATUSES` — tests can
// only be added once the phlebo is actually on the visit, before the sample
// is collected.
const HOME_VISIT_ITEM_ADDABLE_STATUSES: AppOrderStatus[] = [
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
];

function OrderDetailDrawer({ orderId, open, onOpenChange }: OrderDetailDrawerProps) {
  const { data: order, isLoading, isError, error } = useAppOrder(open ? orderId : null);
  const updateStatus = useUpdateAppOrderStatus();
  const removeItem = useRemoveHomeVisitItem();
  const [pendingStatus, setPendingStatus] = useState<AppOrderStatus | "">("");
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<AppOrderItem | null>(null);

  const sortedTimeline = useMemo(() => (order ? sortTimeline(order.timeline) : []), [order]);
  const canEditHomeVisitItems = !!order && HOME_VISIT_ITEM_ADDABLE_STATUSES.includes(order.status);

  function handleRemoveItem() {
    if (!order || !itemToRemove) return;
    removeItem.mutate(
      { orderId: order.id, itemId: itemToRemove.id },
      {
        onSuccess: () => {
          toast.success(`${itemToRemove.name} removed from ${order.orderNumber}`);
          setItemToRemove(null);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to remove item");
        },
      },
    );
  }

  function handleStatusUpdate() {
    if (!order || !pendingStatus) return;
    updateStatus.mutate(
      { orderId: order.id, status: pendingStatus },
      {
        onSuccess: () => {
          toast.success(`${order.orderNumber} status updated to ${pendingStatus}`);
          setPendingStatus("");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update status");
        },
      },
    );
  }

  return (
    <>
      <SidePanel
        open={open}
        onOpenChange={onOpenChange}
        title={order ? order.orderNumber : "Order details"}
        description={order ? `Placed ${formatDateTime(order.createdAt)}` : undefined}
        widthClassName="sm:max-w-xl"
        footer={
          order && (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Select
                value={pendingStatus || order.status}
                onValueChange={(v) => setPendingStatus(v as AppOrderStatus)}
              >
                <SelectTrigger className="w-full sm:w-[190px]">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.toLowerCase().replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleStatusUpdate}
                disabled={
                  updateStatus.isPending || !pendingStatus || pendingStatus === order.status
                }
              >
                {updateStatus.isPending ? "Updating…" : "Update Status"}
              </Button>
            </div>
          )
        }
      >
        {isLoading && (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && isError && (
          <EmptyState
            icon={XCircle}
            title="Couldn't load order details"
            description={error instanceof Error ? error.message : "Something went wrong"}
          />
        )}

        {!isLoading && !isError && order && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={order.status.toLowerCase()} />
              {order.paymentStatus && <StatusPill status={order.paymentStatus.toLowerCase()} />}
              <StatusPill status={order.paymentMode.toLowerCase()} />
            </div>

            <section className="rounded-xl border border-border bg-secondary/30 p-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Customer
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="font-medium text-foreground">{order.customer.name}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {order.customer.mobile}
                </div>
                {order.address && (
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {formatAddress(order.address)} — {order.address.pincode}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {order.patients.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Collecting from ({order.patients.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {order.patients.map((patient) => (
                    <div
                      key={patient.familyMemberId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <User className="size-3.5" />
                        </span>
                        <span className="font-medium text-foreground">{patient.name}</span>
                        <span className="text-xs text-muted-foreground">{patient.relation}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {patient.age} yrs · {patient.gender} · {patient.mobile}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {order.orderType === "HOME_VISIT" && order.items.length === 0 && (
              <section className="rounded-xl border border-dashed border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Stethoscope className="size-3.5" />
                  </span>
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Home visit — no tests chosen yet
                  </h3>
                </div>
                {order.symptomNotes && (
                  <p className="mb-3 text-sm text-foreground">{order.symptomNotes}</p>
                )}
                {!canEditHomeVisitItems && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Available once the phlebotomist has accepted and is on the visit.
                  </p>
                )}
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Items ({order.items.length})
                </h3>
                {order.orderType === "HOME_VISIT" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddItemsOpen(true)}
                    disabled={!canEditHomeVisitItems}
                  >
                    <Plus className="size-3.5" />
                    Add Tests
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <PackageIcon className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-foreground">{item.name}</span>
                        {/* Which of the order's people this test belongs to —
                          the whole point of a multi-member order for ops. */}
                        <span className="block text-xs text-muted-foreground">
                          for {item.patientName}
                        </span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-foreground tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                      {order.orderType === "HOME_VISIT" && canEditHomeVisitItems && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setItemToRemove(item)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.phlebotomyCharges > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phlebotomy Charges</span>
                    <span className="tabular-nums">{formatCurrency(order.phlebotomyCharges)}</span>
                  </div>
                )}
                {order.walletDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Wallet Discount</span>
                    <span className="tabular-nums">- {formatCurrency(order.walletDiscount)}</span>
                  </div>
                )}
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Coupon Discount</span>
                    <span className="tabular-nums">- {formatCurrency(order.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-foreground">
                  <span>Total Payable</span>
                  <span className="tabular-nums">{formatCurrency(order.totalPayable)}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <Wallet className="size-3.5" />
                  Paid via{" "}
                  <span className="font-medium text-foreground capitalize">
                    {order.paymentMode.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IndianRupee className="size-3.5" />
                  Service PIN:{" "}
                  <span className="font-medium text-foreground">{order.servicePin}</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Booking Slot</div>
                {order.slot ? (
                  <>
                    <BookingDate
                      value={order.slot.slotDate}
                      className="mt-1 font-medium text-foreground"
                    />
                    <div className="text-xs text-muted-foreground">
                      {formatTimeRange12h(order.slot.startTime, order.slot.endTime)}
                    </div>
                  </>
                ) : (
                  <div className="mt-1 font-medium text-foreground">Not scheduled</div>
                )}
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Assigned Phlebo</div>
                <div className="mt-1 font-medium text-foreground">
                  {order.phlebotomist?.name ?? "Unassigned"}
                </div>
                {order.phlebotomist && (
                  <div className="text-xs text-muted-foreground">{order.phlebotomist.mobile}</div>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Status Timeline
              </h3>
              <div className="flex flex-col">
                {sortedTimeline.map((step, i) => {
                  const Icon = timelineIcon(step.label);
                  const isLast = i === sortedTimeline.length - 1;
                  return (
                    <div
                      key={`${step.label}-${step.at}`}
                      className="relative flex gap-3 pb-6 last:pb-0"
                    >
                      {!isLast && (
                        <span className="absolute top-8 left-[15px] h-[calc(100%-8px)] w-px bg-border" />
                      )}
                      <div
                        className={cn(
                          "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                          isLast
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{step.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(step.at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </SidePanel>
      {order && (
        <AddHomeVisitItemsDialog order={order} open={addItemsOpen} onOpenChange={setAddItemsOpen} />
      )}
      <AlertDialog
        open={!!itemToRemove}
        onOpenChange={(next) => {
          if (!next) setItemToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToRemove?.name} ({formatCurrency(itemToRemove?.price ?? 0)}) will be dropped from
              this booking and the total re-billed accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeItem.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleRemoveItem();
              }}
            >
              {removeItem.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { OrderDetailDrawer };
