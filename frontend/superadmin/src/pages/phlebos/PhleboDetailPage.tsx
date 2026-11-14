import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Percent,
  Phone,
  Truck,
  UserX,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { StatusPill } from "@/components/common/StatusPill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppOrders } from "@/hooks/queries/useAppOrders";
import { usePhlebotomist, usePhlebotomistStats } from "@/hooks/queries/usePhlebotomists";
import { formatCurrency, formatDate, formatNumber, initials } from "@/lib/format";

import { getAvatarColor } from "./phleboUtils";
import { to12Hour } from "../slots/slotFormat";

const RECENT_ORDERS_COUNT = 5;

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  );
}

function PhleboDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: phlebo, isLoading, isError } = usePhlebotomist(id);
  const { data: stats, isLoading: isStatsLoading } = usePhlebotomistStats(id);
  const { data: recentOrders, isLoading: isOrdersLoading } = useAppOrders({
    phleboId: id,
    page: 1,
    pageSize: RECENT_ORDERS_COUNT,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !phlebo) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          to="/phlebos"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Phlebotomists
        </Link>
        <EmptyState
          icon={UserX}
          title="Phlebotomist not found"
          description="This phlebotomist may have been removed or the link is incorrect."
          action={
            <Button asChild>
              <Link to="/phlebos">Go to Phlebotomists</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/phlebos"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Phlebotomists
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {phlebo.photoUrl ? (
                <img src={phlebo.photoUrl} alt={phlebo.name} className="size-full object-cover" />
              ) : (
                <AvatarFallback
                  style={{ backgroundColor: getAvatarColor(phlebo.id) }}
                  className="text-lg font-semibold text-white"
                >
                  {initials(phlebo.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{phlebo.name}</h1>
                <Badge variant={phlebo.isActive ? "success" : "secondary"}>
                  {phlebo.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {phlebo.mobile}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Joined {formatDate(phlebo.createdAt)}
                </span>
                {phlebo.cityName && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {phlebo.cityName}
                  </span>
                )}
                {phlebo.workingHoursStart && phlebo.workingHoursEnd && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {to12Hour(phlebo.workingHoursStart)} - {to12Hour(phlebo.workingHoursEnd)}
                  </span>
                )}
              </div>
              {phlebo.serviceAreas.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {phlebo.serviceAreas.map((area) => (
                    <Badge key={area.id} variant="outline">
                      {area.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {isStatsLoading || !stats ? (
          Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Orders"
              value={formatNumber(stats.totalOrders)}
              icon={Package}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Completed"
              value={formatNumber(stats.completedOrders)}
              icon={CheckCircle2}
              gradient="bg-success"
              index={1}
            />
            <StatCard
              title="In Progress"
              value={formatNumber(stats.inProgressOrders)}
              icon={Truck}
              gradient="bg-info"
              index={2}
            />
            <StatCard
              title="Cancelled / Rejected"
              value={formatNumber(stats.cancelledOrders + stats.rejectedOrders)}
              icon={XCircle}
              gradient="bg-destructive"
              index={3}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              icon={Percent}
              gradient="bg-brand-violet"
              index={4}
            />
            <StatCard
              title="COD Collected"
              value={formatCurrency(stats.codCollectedTotal)}
              icon={Banknote}
              gradient="bg-warning"
              index={5}
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/orders?phleboId=${phlebo.id}`}>View all</Link>
            </Button>
          </div>

          {isOrdersLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !recentOrders || recentOrders.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No orders assigned to this phlebotomist yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentOrders.rows.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium text-foreground">{order.orderNumber}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {order.customerName} · {order.itemSummary || "Home visit"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.orderDate)}
                    </span>
                    <StatusPill status={order.status.toLowerCase()} />
                    <span className="w-20 text-right font-medium text-foreground tabular-nums">
                      {formatCurrency(order.totalPayable)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { PhleboDetailPage };
