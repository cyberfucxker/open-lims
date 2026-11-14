import { useMemo } from "react";
import { Building2, ListChecks, MapPinCheck, UserRoundCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useAreas } from "@/hooks/queries/useAreas";
import { useAreaApprovalRequests } from "@/hooks/queries/useAreaApprovalRequests";
import { usePhlebotomists } from "@/hooks/queries/usePhlebotomists";

import { AreasTab } from "../slots/AreasTab";
import { AreaApprovalTab } from "./AreaApprovalTab";
import { CitiesTab } from "./CitiesTab";
import { StatesTab } from "./StatesTab";

function CitiesAreasPage() {
  const citiesQuery = useCities();
  // pageSize 1 on purpose: only `total` is read. Counting a fetched page was
  // the bug these tiles had — they reported the page size (200), not reality.
  const areasQuery = useAreas({ page: 1, pageSize: 1 });
  const serviceableQuery = useAreas({ page: 1, pageSize: 1, isActive: true });
  const phlebosQuery = usePhlebotomists();
  const pendingAreaRequestsQuery = useAreaApprovalRequests({
    status: "PENDING",
    page: 1,
    pageSize: 1,
  });
  const pendingAreaRequestsCount = pendingAreaRequestsQuery.data?.total ?? 0;

  const stats = useMemo(
    () => ({
      activeCities: citiesQuery.data?.length ?? 0,
      totalAreas: areasQuery.data?.total ?? 0,
      serviceableAreas: serviceableQuery.data?.total ?? 0,
      activePhlebos: phlebosQuery.data?.length ?? 0,
    }),
    [citiesQuery.data, areasQuery.data, serviceableQuery.data, phlebosQuery.data],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cities & Areas"
        description="Manage patient app serviceability and coverage areas — the same Area data that drives real booking capacity in Slot Management."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Cities"
          value={formatNumber(stats.activeCities)}
          icon={Building2}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Total Areas"
          value={formatNumber(stats.totalAreas)}
          icon={ListChecks}
          gradient="bg-sky-500"
          index={1}
        />
        <StatCard
          title="Serviceable Areas"
          value={formatNumber(stats.serviceableAreas)}
          icon={MapPinCheck}
          gradient="bg-emerald-500"
          index={2}
        />
        <StatCard
          title="Active Phlebotomists"
          value={formatNumber(stats.activePhlebos)}
          icon={UserRoundCheck}
          gradient="bg-amber-500"
          index={3}
        />
      </div>

      <Tabs defaultValue="cities">
        <TabsList>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="area-approval">
            Area Approval
            {pendingAreaRequestsCount > 0 && (
              <Badge variant="warning" className="ml-1.5 px-1.5 py-0">
                {pendingAreaRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="mt-2">
          <StatesTab />
        </TabsContent>

        <TabsContent value="cities" className="mt-2">
          <CitiesTab />
        </TabsContent>

        <TabsContent value="areas" className="mt-2">
          <AreasTab />
        </TabsContent>

        <TabsContent value="area-approval" className="mt-2">
          <AreaApprovalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { CitiesAreasPage };
