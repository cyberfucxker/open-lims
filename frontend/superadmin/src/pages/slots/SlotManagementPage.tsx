import {
  Ban,
  CalendarClock,
  CalendarRange,
  Gauge,
  LayoutTemplate,
  MapPinned,
  Settings as SettingsIcon,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";
import { useSlotDashboardStats } from "@/hooks/queries/useSlotDashboardStats";

import { AreasTab } from "./AreasTab";
import { AreaSlotBlockTab } from "./AreaSlotBlockTab";
import { CityConfigTab } from "./CityConfigTab";
import { DailySlotBlockTab } from "./DailySlotBlockTab";
import { HolidayTab } from "./HolidayTab";
import { LiveCapacityTab } from "./LiveCapacityTab";
import { PhlebotomistAvailabilityTab } from "./PhlebotomistAvailabilityTab";
import { SlotAvailabilitySettingsTab } from "./SlotAvailabilitySettingsTab";
import { SlotTemplatesTab } from "./SlotTemplatesTab";

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

function SlotManagementPage() {
  const { data: stats, isLoading } = useSlotDashboardStats();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Slot Management"
        description="Define reusable slot templates, assign them to cities, and manage holiday/area/manual blocking with capacity derived from live phlebotomist coverage."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading || !stats ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Cities"
              value={formatNumber(stats.totalCities)}
              icon={MapPinned}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Active Slot Templates"
              value={formatNumber(stats.activeSlotTemplates)}
              icon={LayoutTemplate}
              gradient="bg-sky-500"
              index={1}
            />
            <StatCard
              title="Today's Bookings"
              value={formatNumber(stats.todaysBookings)}
              icon={CalendarRange}
              gradient="bg-emerald-500"
              index={2}
            />
            <StatCard
              title="Blocked Slots Today"
              value={formatNumber(stats.blockedSlotsToday)}
              icon={Ban}
              gradient="bg-orange-500"
              index={3}
              alert={stats.blockedSlotsToday > 0}
            />
            <StatCard
              title="Available Capacity Today"
              value={formatNumber(stats.availableCapacityToday)}
              icon={Gauge}
              gradient="bg-violet-500"
              index={4}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="flex-wrap">
          <TabsTrigger value="templates">
            <LayoutTemplate /> Slot Templates
          </TabsTrigger>
          <TabsTrigger value="areas">
            <MapPinned /> Areas
          </TabsTrigger>
          <TabsTrigger value="city-config">
            <CalendarClock /> City Config
          </TabsTrigger>
          <TabsTrigger value="daily-blocks">
            <Ban /> Slot Blocks
          </TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="area-blocks">Area Blocks</TabsTrigger>
          <TabsTrigger value="live-capacity">
            <Gauge /> Live Capacity
          </TabsTrigger>
          <TabsTrigger value="phlebo-availability">Phlebo Availability</TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <SlotTemplatesTab />
        </TabsContent>
        <TabsContent value="areas">
          <AreasTab />
        </TabsContent>
        <TabsContent value="city-config">
          <CityConfigTab />
        </TabsContent>
        <TabsContent value="daily-blocks">
          <DailySlotBlockTab />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidayTab />
        </TabsContent>
        <TabsContent value="area-blocks">
          <AreaSlotBlockTab />
        </TabsContent>
        <TabsContent value="live-capacity">
          <LiveCapacityTab />
        </TabsContent>
        <TabsContent value="phlebo-availability">
          <PhlebotomistAvailabilityTab />
        </TabsContent>
        <TabsContent value="settings">
          <SlotAvailabilitySettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { SlotManagementPage };
