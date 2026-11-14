import { Activity, CalendarClock, CheckCircle2, ClipboardList, IndianRupee } from "lucide-react";

import { StatTiles, type StatTile } from "@/components/common/StatTiles";
import { formatRupees } from "@/utils/format";
import type { OrderListItem, OrdersFilter } from "@/types";

import { getOrderStatusPresentation } from "./orderStatus";

/** A booking counts as "in progress" once the phlebotomist workflow has actually moved
 *  past confirmation — stage 2+ on ORDER_STATUS_TIMELINE and not yet terminal. */
function countInProgress(orders: OrderListItem[]): number {
  return orders.filter((order) => {
    const status = getOrderStatusPresentation(order.orderStatus);
    return status.step !== null && status.step > 1 && !status.isTerminal;
  }).length;
}

function countCompleted(orders: OrderListItem[]): number {
  return orders.filter((order) => getOrderStatusPresentation(order.orderStatus).key === "COMPLETED")
    .length;
}

/** The middle tile adapts to the active tab so it always carries a meaningful number —
 *  "in progress" is dead weight on the Past tab, "completed" is dead weight on Upcoming. */
function buildTiles(filter: OrdersFilter, orders: OrderListItem[]): StatTile[] {
  const value = orders.reduce((sum, order) => sum + order.bookingAmount, 0);

  const first: StatTile =
    filter === "upcoming"
      ? {
          label: "Scheduled",
          value: String(orders.length),
          icon: CalendarClock,
          iconClass: "bg-primary/10 text-primary",
        }
      : {
          label: "Bookings",
          value: String(orders.length),
          icon: ClipboardList,
          iconClass: "bg-primary/10 text-primary",
        };

  const second: StatTile =
    filter === "past"
      ? {
          label: "Completed",
          value: String(countCompleted(orders)),
          icon: CheckCircle2,
          iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        }
      : {
          label: "In progress",
          value: String(countInProgress(orders)),
          icon: Activity,
          iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        };

  return [
    first,
    second,
    {
      label: "Total value",
      value: formatRupees(value),
      icon: IndianRupee,
      iconClass: "bg-brand-teal/10 text-brand-teal",
    },
  ];
}

interface OrdersSummaryRailProps {
  filter: OrdersFilter;
  orders: OrderListItem[];
  isLoading?: boolean;
}

/** At-a-glance read-out for the bookings currently in view. Derived entirely from the
 *  list the active tab already fetched — no extra request. */
function OrdersSummaryRail({ filter, orders, isLoading = false }: OrdersSummaryRailProps) {
  return <StatTiles tiles={buildTiles(filter, orders)} isLoading={isLoading} />;
}

export { OrdersSummaryRail };
