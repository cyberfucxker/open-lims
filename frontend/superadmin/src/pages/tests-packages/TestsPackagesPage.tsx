import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FlaskConical, Package, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";
import { usePackages } from "@/hooks/queries/usePackages";
import { useTests } from "@/hooks/queries/useTests";

import { DepartmentsTab } from "./DepartmentsTab";
import { PackagesTab } from "./PackagesTab";
import { ParametersTab } from "./ParametersTab";
import { SampleTypesTab } from "./SampleTypesTab";
import { TestsTab } from "./TestsTab";

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  );
}

function TestsPackagesPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";

  const [tab, setTab] = useState("tests");

  // A generous pageSize keeps the "most popular test" stat representative without a
  // dedicated aggregate endpoint on the backend.
  const { data: testsResult, isLoading: testsLoading } = useTests({ page: 1, pageSize: 100 });
  const { data: packagesResult, isLoading: packagesLoading } = usePackages({
    page: 1,
    pageSize: 1,
  });

  const tests = useMemo(() => testsResult?.rows ?? [], [testsResult]);

  const mostPopularTest = useMemo(
    () =>
      tests.reduce(
        (top, t) => (t.bookedCount > (top?.bookedCount ?? -1) ? t : top),
        tests[0] ?? null,
      ),
    [tests],
  );

  const isLoading = testsLoading || packagesLoading;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tests & Packages"
        description="The catalogue, bottom-up: parameters are the analytes you measure, tests are priced panels of them collected as a sample type, and packages bundle tests plus any independently-bookable parameters."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Tests"
              value={formatNumber(testsResult?.total ?? 0)}
              icon={FlaskConical}
              gradient="bg-primary"
              index={0}
            />
            <StatCard
              title="Total Packages"
              value={formatNumber(packagesResult?.total ?? 0)}
              icon={Package}
              gradient="bg-emerald-500"
              index={1}
            />
            <StatCard
              title="Most Popular Test"
              value={mostPopularTest ? mostPopularTest.shortName : "—"}
              icon={TrendingUp}
              gradient="bg-amber-500"
              index={2}
              breakdown={
                mostPopularTest
                  ? [{ label: "Orders", value: formatNumber(mostPopularTest.bookedCount) }]
                  : undefined
              }
            />
          </>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="sample-types">Sample Types</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-3">
          <TestsTab initialSearch={initialSearch} />
        </TabsContent>

        <TabsContent value="packages" className="mt-3">
          <PackagesTab />
        </TabsContent>

        <TabsContent value="parameters" className="mt-3">
          <ParametersTab />
        </TabsContent>

        <TabsContent value="sample-types" className="mt-3">
          <SampleTypesTab />
        </TabsContent>

        <TabsContent value="departments" className="mt-3">
          <DepartmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { TestsPackagesPage };
