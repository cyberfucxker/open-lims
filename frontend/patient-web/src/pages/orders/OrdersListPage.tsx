import { useMemo, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  History,
  LayoutList,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/catalog/SearchBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCardSkeletonList } from "@/components/orders/OrderCardSkeleton";
import { OrderListItem } from "@/components/orders/OrderListItem";
import { useOrders } from "@/hooks/queries/useOrders";
import { cn } from "@/utils/cn";
import type { OrderListItem as OrderListItemType, OrdersFilter } from "@/types";

const TABS: { value: OrdersFilter; label: string; icon: LucideIcon }[] = [
  { value: "upcoming", label: "Upcoming", icon: CalendarClock },
  { value: "past", label: "Past", icon: History },
  { value: "all", label: "All", icon: LayoutList },
];

const EMPTY_COPY: Record<OrdersFilter, { title: string; description: string }> = {
  upcoming: {
    title: "No upcoming collections",
    description: "Book a test or health package and your next home visit will appear here.",
  },
  past: {
    title: "Nothing in your history yet",
    description: "Completed and cancelled bookings are archived here for your records.",
  },
  all: {
    title: "No bookings yet",
    description: "Book a test or package to start building your health record.",
  },
};

function matchesQuery(order: OrderListItemType, query: string): boolean {
  return (
    order.orderNo.toLowerCase().includes(query) ||
    order.patientName.toLowerCase().includes(query) ||
    order.orderStatus.toLowerCase().includes(query)
  );
}

function OrdersListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OrdersFilter>("upcoming");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useOrders(filter);

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    const list = data ?? [];
    return query ? list.filter((order) => matchesQuery(order, query)) : list;
  }, [data, query]);

  const showSearch = (data?.length ?? 0) > 0 || query.length > 0;

  const renderList = () => {
    if (isLoading) return <OrderCardSkeletonList count={3} />;

    if (visible.length === 0) {
      return query ? (
        <EmptyState
          icon={SearchX}
          title={`No bookings match “${search.trim()}”`}
          description="Try a different order number, patient name or status."
          actionLabel="Clear search"
          onAction={() => setSearch("")}
        />
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={EMPTY_COPY[filter].title}
          description={EMPTY_COPY[filter].description}
          actionLabel="Browse tests"
          onAction={() => navigate("/tests")}
        />
      );
    }

    return (
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        {visible.map((order, i) => (
          <OrderListItem key={order.id} order={order} index={i} />
        ))}
      </div>
    );
  };

  return (
    <div className="pb-10">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as OrdersFilter)}>
        <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md md:top-[var(--top-nav-height)]">
          <div className="mx-auto flex max-w-5xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full sm:w-auto">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 px-3 sm:px-4">
                  <tab.icon className="hidden size-3.5 sm:block" />
                  {tab.label}
                  {filter === tab.value && !isLoading && (
                    <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary tabular-nums">
                      {visible.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {showSearch && (
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Order no, patient or status…"
                aria-label="Search bookings"
                className="h-10 rounded-xl"
                containerClassName="sm:w-72"
              />
            )}
          </div>
          <div
            aria-hidden
            className={cn(
              "h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-300",
              isFetching && !isLoading ? "animate-pulse opacity-100" : "opacity-0",
            )}
          />
        </div>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mx-auto max-w-5xl px-4 pt-4">
            {renderList()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export { OrdersListPage };
