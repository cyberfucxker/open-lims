import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { HeroSection } from "@/components/home/HeroSection";
import { QuickActions } from "@/components/home/QuickActions";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { OffersSection } from "@/components/home/OffersSection";
import { PackagesSection } from "@/components/home/PackagesSection";
import { PopularTestsSection } from "@/components/home/PopularTestsSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LabsNetworkSection } from "@/components/home/LabsNetworkSection";
import { OurPresenceSection } from "@/components/home/OurPresenceSection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { SectionDivider } from "@/components/home/SectionDivider";
import { Breadcrumbs } from "@/components/home/Breadcrumbs";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { HomeSeoContentSection } from "@/components/home/HomeSeoContentSection";
import { useHomeFaqs } from "@/hooks/queries/useHomeFaqs";
import { useHomeSeoContent } from "@/hooks/queries/useHomeSeoContent";
import { useSyncHomeCityToRoute } from "@/hooks/useSyncHomeCityToRoute";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { getHome } from "@/services/api/homeApi";
import { useCityStore } from "@/store/cityStore";
import { withCityToken } from "@/utils/cityToken";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, type BreadcrumbItem } from "@/utils/seoJsonLd";

/** The generic, city-independent front door.
 *
 *  This page used to double as every city landing page: `/jaipur` rendered
 *  exactly this component with Jaipur selected, which meant one layout doing
 *  two jobs and fifty near-identical URLs competing for the same rankings.
 *  The local pages moved to `/city/{slug}` and `pages/city/CityPage.tsx`,
 *  which has its own layout and its own copy.
 *
 *  What stayed behind is city-neutral where it counts: the title, the
 *  description and the canonical never mention a city, whatever the URL
 *  says. The picker still works and prices still follow it — the store's
 *  selected city is passed to `getHome` below, and has to be, or the prices
 *  here would disagree with the cart.
 *
 *  The URL does carry a city once one is picked — `/` becomes `/jaipur` — so
 *  the page can be shared as the city it was being read as. That is a *state*
 *  city-independent: it names no city anywhere, and there is no `/{slug}`
 *  form of it. `/{citySlug}` is a page of its own (`CityPage`). */
function HomePage() {
  // Picking a city while on Home takes the visitor to that city's own page —
  // Home itself never carries a city in its URL any more.
  useSyncHomeCityToRoute();

  const cityId = useCityStore((s) => s.city?.id);

  // The URL decides whether this page names a city — nothing else does.
  //
  // The store always holds one, because prices need one, and reading the name
  // from there meant deleting `/jodhpur` back to `/` left "in Jodhpur" on a
  // page whose URL no longer claimed it. Clear the slug and the city is gone
  // from the headline, the section headings and the `{city}` copy alike;
  // prices, the location pill and the home query carry on off the store.
  // Home is the generic, city-independent entry point: it names no city, in
  // its headings, its FAQs or its copy. `/{citySlug}` is the page that does.
  const cityName = undefined;

  // Keyed on `cityId` (not just `["home"]`) so switching cities refetches
  // with that city's price list instead of showing stale prices from
  // whichever city was selected first — see `homeApi.ts#getHome`'s
  // doc-comment.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home", cityId ?? null],
    queryFn: () => getHome(cityId),
  });

  const { data: rawFaqs, isLoading: isFaqsLoading } = useHomeFaqs();
  const { data: seoContent, isLoading: isSeoLoading } = useHomeSeoContent();

  // City-substituted once here so the visible accordion and the FAQPage
  // JSON-LD below always render from the exact same strings.
  //
  // Body copy follows a chosen city even though this page's SEO never does:
  // the CMS authors it with a `{city}` token, and "in Jaipur" reads better
  // than "in your city" to someone who has told us they're in Jaipur. It's a
  // greeting, not a claim the canonical URL makes — and it stays generic
  // until they actually say so.
  const faqs = useMemo(
    () =>
      (rawFaqs ?? []).map((faq) => ({
        id: faq.id,
        question: withCityToken(faq.question, cityName),
        answer: withCityToken(faq.answer, cityName),
      })),
    [rawFaqs, cityName],
  );

  const seoHeading = seoContent ? withCityToken(seoContent.heading, cityName) : null;
  const seoBody = seoContent ? withCityToken(seoContent.body, cityName) : null;

  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Home" }];

  const jsonLd = useMemo(() => {
    const graph: Record<string, unknown>[] = [buildBreadcrumbJsonLd(breadcrumbItems)];
    if (faqs.length > 0) graph.push(buildFaqJsonLd(faqs));
    return { "@context": "https://schema.org", "@graph": graph };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- breadcrumbItems is a fresh literal each render; cityName/faqs are its real deps
  }, [cityName, faqs]);

  // No city anywhere in here, whatever the picker says — `/{slug}` is what
  // ranks for "tests in Jaipur", and this page competing for the same phrase
  // would only split them.
  useSeoMeta({
    title: "Book Diagnostic Tests & Full Body Checkups Online | Example Diagnostics Lab",
    description:
      "Book blood tests, full body checkups and health packages online with free home sample collection and digital reports from Example Diagnostics Lab.",
    // `/{citySlug}` is what should rank for "tests in Jaipur", so this must
    // not compete with it.
    canonicalPath: "/",
    jsonLd,
  });

  return (
    <div className="bg-background">
      <HeroSection banners={data?.home_banners} cityName={cityName} />

      {/* Single source of truth for the gaps between home sections — none of the section
          components carry vertical padding of their own, so tune the rhythm here. */}
      <div className="space-y-10 pt-7 pb-12 sm:space-y-14 sm:pt-9 sm:pb-16">
        <QuickActions />

        <PackagesSection
          isLoading={isLoading}
          isError={isError}
          packages={data?.packages}
          cityName={cityName}
        />

        <PopularTestsSection
          isLoading={isLoading}
          isError={isError}
          tests={data?.tests}
          cityName={cityName}
        />

        {!isLoading && data && data.coupons.length > 0 && <OffersSection coupons={data.coupons} />}

        <CategoriesSection categories={data?.categories} isLoading={isLoading} />

        <SectionDivider toneClassName="text-accent/50" />

        <HowItWorks />

        <LabsNetworkSection />

        <OurPresenceSection />

        <TrustBadges />

        <ReviewsSection />

        <HomeSeoContentSection heading={seoHeading} body={seoBody} isLoading={isSeoLoading} />

        <HomeFaqSection faqs={faqs} isLoading={isFaqsLoading} />

        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <FloatingCartBar />
    </div>
  );
}

export { HomePage };
