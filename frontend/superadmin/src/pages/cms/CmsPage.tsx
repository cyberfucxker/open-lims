import { useMemo } from "react";
import {
  FileStack,
  FlaskConical,
  HelpCircle,
  Image as ImageIcon,
  LayoutGrid,
  PackageSearch,
  TicketPercent,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";
import { useAppCategories } from "@/hooks/queries/useAppCategories";
import { useBanners } from "@/hooks/queries/useBanners";
import { useCmsPages } from "@/hooks/queries/useCmsPages";
import { useCoupons } from "@/hooks/queries/useCoupons";
import { useHomeFaqs } from "@/hooks/queries/useHomeFaqs";
import { usePackages } from "@/hooks/queries/usePackages";
import { useTests } from "@/hooks/queries/useTests";

import { BannersTab } from "./BannersTab";
import { WebBannerTab } from "./WebBannerTab";
import { CategoriesTab } from "./CategoriesTab";
import { CmsPagesTab } from "./CmsPagesTab";
import { CouponsTab } from "./CouponsTab";
import { HomeFaqsTab } from "./HomeFaqsTab";
import { PhlebotomyChargesTab } from "./PhlebotomyChargesTab";
import { PopularPackagesTab } from "./PopularPackagesTab";
import { PopularTestsTab } from "./PopularTestsTab";
import { LandingPagesTab } from "./LandingPagesTab";

function CmsPage() {
  // pageSize:1 purely to read `total` — same cross-dataset-counter convention
  // as Order Management's stat cards (no dedicated stats endpoint exists).
  const { data: publishedPagesResult } = useCmsPages({ status: "PUBLISHED", page: 1, pageSize: 1 });

  const { data: bannersResult } = useBanners({ page: 1, pageSize: 100 });
  const banners = useMemo(() => bannersResult?.rows ?? [], [bannersResult]);

  const { data: categoriesResult } = useAppCategories({ page: 1, pageSize: 100 });
  const categories = useMemo(() => categoriesResult?.rows ?? [], [categoriesResult]);

  const { data: couponsResult } = useCoupons({ page: 1, pageSize: 100 });
  const coupons = useMemo(() => couponsResult?.rows ?? [], [couponsResult]);

  const { data: packagesResult } = usePackages({ active: true, page: 1, pageSize: 100 });
  const packages = useMemo(() => packagesResult?.rows ?? [], [packagesResult]);

  const { data: testsResult } = useTests({ status: "Active", page: 1, pageSize: 100 });
  const tests = useMemo(() => testsResult?.rows ?? [], [testsResult]);

  const { data: homeFaqsResult } = useHomeFaqs({ page: 1, pageSize: 100 });
  const homeFaqs = useMemo(() => homeFaqsResult?.rows ?? [], [homeFaqsResult]);

  const stats = useMemo(
    () => ({
      publishedPages: publishedPagesResult?.total ?? 0,
      activeBanners: banners.filter((b) => b.isActive).length,
      activeCategories: categories.filter((c) => c.isActive).length,
      activeCoupons: coupons.filter((c) => c.isActive).length,
      popularPackages: packages.filter((p) => p.isPopular).length,
      popularTests: tests.filter((t) => t.isPopular).length,
      activeHomeFaqs: homeFaqs.filter((f) => f.isActive).length,
    }),
    [publishedPagesResult, banners, categories, coupons, packages, tests, homeFaqs],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="CMS & Marketing"
        description="Manage static pages, home-screen banners and promotional coupons for the Example Lab patient app."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Published Pages"
          value={formatNumber(stats.publishedPages)}
          icon={FileStack}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Active Banners"
          value={formatNumber(stats.activeBanners)}
          icon={ImageIcon}
          gradient="bg-sky-500"
          index={1}
        />
        <StatCard
          title="Active Categories"
          value={formatNumber(stats.activeCategories)}
          icon={LayoutGrid}
          gradient="bg-violet-500"
          index={2}
        />
        <StatCard
          title="Active Coupons"
          value={formatNumber(stats.activeCoupons)}
          icon={TicketPercent}
          gradient="bg-emerald-500"
          index={3}
        />
        <StatCard
          title="Popular Packages"
          value={formatNumber(stats.popularPackages)}
          icon={PackageSearch}
          gradient="bg-amber-500"
          index={4}
        />
        <StatCard
          title="Popular Tests"
          value={formatNumber(stats.popularTests)}
          icon={FlaskConical}
          gradient="bg-rose-500"
          index={5}
        />
        <StatCard
          title="Active Home FAQs"
          value={formatNumber(stats.activeHomeFaqs)}
          icon={HelpCircle}
          gradient="bg-teal-500"
          index={6}
        />
      </div>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="banners">Banners & Offers</TabsTrigger>
          <TabsTrigger value="web-banner">Web Banner</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="landing-pages">Landing Pages</TabsTrigger>
          <TabsTrigger value="popular-packages">Popular Packages</TabsTrigger>
          <TabsTrigger value="popular-tests">Popular Tests</TabsTrigger>
          <TabsTrigger value="phlebotomy-charges">Phlebotomy Charges</TabsTrigger>
          <TabsTrigger value="home-faqs">Home FAQs</TabsTrigger>
        </TabsList>
        <TabsContent value="pages">
          <CmsPagesTab />
        </TabsContent>
        <TabsContent value="banners">
          <BannersTab />
        </TabsContent>

        <TabsContent value="web-banner">
          <WebBannerTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="landing-pages">
          <LandingPagesTab />
        </TabsContent>
        <TabsContent value="popular-packages">
          <PopularPackagesTab />
        </TabsContent>
        <TabsContent value="popular-tests">
          <PopularTestsTab />
        </TabsContent>
        <TabsContent value="phlebotomy-charges">
          <PhlebotomyChargesTab />
        </TabsContent>
        <TabsContent value="home-faqs">
          <HomeFaqsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { CmsPage };
