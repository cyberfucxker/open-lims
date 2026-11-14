import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { HeroSection } from "@/components/home/HeroSection";
import { CityTrustRow } from "@/components/city/CityTrustRow";
import { CityHomeCollection } from "@/components/city/CityHomeCollection";
import { CityLinksSection } from "@/components/city/CityLinksSection";
import { Breadcrumbs } from "@/components/home/Breadcrumbs";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { HomeSeoContentSection } from "@/components/home/HomeSeoContentSection";
import { PackagesSection } from "@/components/home/PackagesSection";
import { PopularTestsSection } from "@/components/home/PopularTestsSection";
import { SectionDivider } from "@/components/home/SectionDivider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdoptCityFromRoute } from "@/hooks/useAdoptCityFromRoute";
import { useSyncCityPageToRoute } from "@/hooks/useSyncCityPageToRoute";
import { useCities } from "@/hooks/queries/useCities";
import { useHomeFaqs } from "@/hooks/queries/useHomeFaqs";
import { useHomeSeoContent } from "@/hooks/queries/useHomeSeoContent";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { catalogApi } from "@/services/api/catalogApi";
import { getHome } from "@/services/api/homeApi";
import { buildCatalogItemPath, buildCityPath } from "@/utils/routes";
import { withCityToken } from "@/utils/cityToken";
import {
  buildBreadcrumbJsonLd,
  buildCityServiceJsonLd,
  buildFaqJsonLd,
  type BreadcrumbItem,
} from "@/utils/seoJsonLd";

/** A city landing page — `/city/jaipur`.
 *
 *  Its own page, not the Home page with a city selected. Home is the generic
 *  front door: a rotating hero carousel, quick actions, categories, the whole
 *  product. This is the answer to one search query — "lab in Ajmer" — and it
 *  is built for that: a local headline, a search box scoped to the city, the
 *  tests and packages priced there, how collection works there, the city's
 *  FAQs, and links to every other city.
 *
 *  Everything local comes from `citySlug`. Nothing about a city is written
 *  into this file — the name, the id the prices are fetched with, and the
 *  canonical URL all resolve from the slug through `GET /master/cities`, so
 *  adding a city in the admin panel adds its page. */
function CityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data: cities, isLoading: isCitiesLoading } = useCities();

  // The URL's city wins on arrival, and a later pick from the picker writes
  // itself back into the URL. Each no-ops once the two agree.
  useAdoptCityFromRoute(citySlug);
  useSyncCityPageToRoute(citySlug);

  const city = cities?.find((c) => c.slug === citySlug);
  const cityId = city?.id;
  const cityName = city?.name;

  // Keyed on `cityId` so each city's page holds its own price list rather
  // than reusing whichever city was fetched first — same reasoning as
  // `HomePage`'s own home query.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home", cityId ?? null],
    queryFn: () => getHome(cityId),
    enabled: !!cityId,
  });

  // Just the count, for the hero's strapline — a one-row page is the cheapest
  // way the list endpoint will report its total, and a real number beats a
  // rounded marketing claim that goes stale.
  const { data: testCount } = useQuery({
    queryKey: ["city-test-count", cityId],
    queryFn: () => catalogApi.listTests(cityId, null, 1, 1).then((r) => r.total),
    enabled: !!cityId,
    staleTime: 10 * 60 * 1000,
  });

  // The CITY banner list, in the shape the masthead takes. A city slide can
  // promote a package, and that package's own page is where it should lead —
  // the admin's `link_url` only applies when there is no package attached,
  // exactly as it does everywhere else a banner is clickable.
  const cityBanners = useMemo(
    () =>
      data?.web_banners.map((banner) => ({
        id: banner.id,
        image: banner.image,
        link_url: banner.package
          ? buildCatalogItemPath({
              kind: "packages",
              id: banner.package.id,
              slug: banner.package.slug,
              citySlug,
            })
          : banner.link_url,
        // The city is worded in here rather than in the hero: the page is
        // what knows which city it is about, and the hero is shared with Home,
        // which has no city to name.
        promoLabel: banner.package ? `${banner.package.name} in ${city?.name}` : null,
      })),
    [data?.web_banners, citySlug, city?.name],
  );

  const { data: rawFaqs, isLoading: isFaqsLoading } = useHomeFaqs();
  const { data: seoContent, isLoading: isSeoLoading } = useHomeSeoContent();

  // City-substituted once here so the visible accordion and the FAQPage
  // JSON-LD below always render from the exact same strings.
  const faqs = useMemo(
    () =>
      (rawFaqs ?? []).map((faq) => ({
        id: faq.id,
        question: withCityToken(faq.question, cityName),
        answer: withCityToken(faq.answer, cityName),
      })),
    [rawFaqs, cityName],
  );

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
    { label: cityName ?? "City" },
  ];

  const jsonLd = useMemo(() => {
    const graph: Record<string, unknown>[] = [buildBreadcrumbJsonLd(breadcrumbItems)];
    if (cityName) graph.push(buildCityServiceJsonLd(cityName));
    if (faqs.length > 0) graph.push(buildFaqJsonLd(faqs));
    return { "@context": "https://schema.org", "@graph": graph };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- breadcrumbItems is a fresh literal each render; cityName/faqs are its real deps
  }, [cityName, faqs]);

  useSeoMeta({
    title: cityName
      ? `Book Diagnostic Tests & Health Checkups in ${cityName} | Example Diagnostics Lab`
      : "Book Diagnostic Tests & Health Checkups | Example Diagnostics Lab",
    description: cityName
      ? `Book blood tests, full body checkups and health packages in ${cityName} with free home sample collection and doctor-verified digital reports from Example Diagnostics Lab.`
      : "Book blood tests, full body checkups and health packages with free home sample collection from Example Diagnostics Lab.",
    canonicalPath: citySlug ? buildCityPath(citySlug) : "/",
    jsonLd,
  });

  // A slug that matches no active city — mistyped, or a city since
  // deactivated. Only once the list has actually arrived: bouncing while it
  // is still in flight would send every visitor Home on a cold load.
  if (!isCitiesLoading && cities && !city) return <Navigate to="/" replace />;

  if (!city) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 pt-6">
        <Skeleton className="h-64 rounded-3xl sm:h-80" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const seoHeading = seoContent ? withCityToken(seoContent.heading, cityName) : null;
  const seoBody = seoContent ? withCityToken(seoContent.body, cityName) : null;

  return (
    <div className="bg-background">
      {/* The same masthead Home uses, fed this page's own material: the CITY
          banner list (Superadmin > CMS > Web Banner), the city in the heading,
          a strapline counting the tests this city's price list actually
          carries, and the trust row in place of Home's search chips. One
          layout, two sets of content — which is the split that was wanted,
          rather than two different-looking search boxes. */}
      <HeroSection
        banners={cityBanners}
        cityName={city.name}
        heading={`Trusted Diagnostic Lab in ${city.name} for Accurate Test Results`}
        subtitle={`${testCount ? `${testCount}+ tests` : "Tests"} from glucose to genetics, collected at your door in ${city.name}.`}
        footer={<CityTrustRow />}
      />

      {/* Single source of truth for the gaps between this page's sections —
          none of them carry vertical padding of their own, same convention as
          `HomePage`. */}
      <div className="space-y-10 pt-8 pb-12 sm:space-y-14 sm:pt-10 sm:pb-16">
        <PopularTestsSection
          isLoading={isLoading}
          isError={isError}
          tests={data?.tests}
          cityName={city.name}
        />

        <PackagesSection
          isLoading={isLoading}
          isError={isError}
          packages={data?.packages}
          cityName={city.name}
        />

        <CityHomeCollection cityName={city.name} citySlug={city.slug} />

        <SectionDivider toneClassName="text-accent/50" />

        <HomeSeoContentSection heading={seoHeading} body={seoBody} isLoading={isSeoLoading} />

        <HomeFaqSection faqs={faqs} isLoading={isFaqsLoading} />

        <CityLinksSection currentSlug={city.slug} />

        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <FloatingCartBar />
    </div>
  );
}

export { CityPage };
