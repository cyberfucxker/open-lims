import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplet,
  FileSearch,
  FolderTree,
  ListChecks,
  Loader2,
  MapPin,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { ParameterList } from "@/components/catalog/ParameterList";
import { CatalogFactGrid, type CatalogFact } from "@/components/catalog/CatalogFactGrid";
import { ExpandableRichContent } from "@/components/catalog/ExpandableRichContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddToCart } from "@/hooks/queries/useCart";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { useAdoptCityFromRoute } from "@/hooks/useAdoptCityFromRoute";
import { useSyncCityToRoute } from "@/hooks/useSyncCityToRoute";
import { buildCatalogItemPath, type CatalogDetailKind } from "@/utils/routes";
import { catalogApi } from "@/services/api/catalogApi";
import type { TestDetail } from "@/types";

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** City-slug mode gets a keyword-rich title/description/canonical/JSON-LD;
 *  the plain id-based route (no city context to speak of) gets a plainer
 *  version of the same. Either way the tab/crawler always sees SOMETHING
 *  specific, never the site-wide default from index.html. */
function useTestSeoMeta(test: TestDetail | undefined) {
  const city = test?.city;
  const kindLabel = test?.isParameter ? "parameter" : "test";
  const price = test ? (test.offerPrice ?? test.price) : 0;
  const description = test?.description
    ? stripHtml(test.description).slice(0, 155)
    : test
      ? `Book the ${test.name} ${kindLabel}${city ? ` in ${city.name}` : ""} with free home sample collection. Reports in ${test.reportTime}.`
      : undefined;

  useSeoMeta({
    title: test
      ? city
        ? `${test.name} in ${city.name} — Book Online | Example Diagnostics Lab`
        : `${test.name} | Example Diagnostics Lab`
      : "Example Diagnostics Lab",
    description,
    // Always the item's OWN family — a shadow Test canonicalises to
    // `/parameter/...` even when this render came from a `/tests/...` URL
    // (which then redirects, see `TestDetailPage`), so one analyte never
    // presents two indexable URLs to a crawler.
    canonicalPath: test
      ? city
        ? buildCatalogItemPath({
            kind: "tests",
            id: test.id,
            slug: test.slug,
            citySlug: city.slug,
            isParameter: test.isParameter,
          })
        : `/tests/${test.id}`
      : undefined,
    jsonLd: test
      ? {
          "@context": "https://schema.org",
          "@type": "MedicalTest",
          name: test.name,
          description: description,
          ...(city ? { areaServed: { "@type": "City", name: city.name } } : {}),
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }
      : undefined,
  });
}

/** Report-time/fasting/sample/recommendation tiles — every one of these comes
 *  straight off the Test record (see `catalogDetail.service.ts#getTestDetail`),
 *  the same prep fields `PackageDetail` already carried. */
function buildFacts(test: TestDetail): CatalogFact[] {
  const facts: CatalogFact[] = [
    { icon: ListChecks, label: "Parameters", value: `${test.parameters.length || 1}` },
    { icon: Clock, label: "Report Time", value: test.reportTime },
    { icon: Droplet, label: "Sample Type", value: test.sampleType },
    test.isFastingRequired
      ? {
          icon: UtensilsCrossed,
          label: "Fasting",
          value: test.fastingHours ? `${test.fastingHours}h required` : "Required",
          tone: "warning",
        }
      : { icon: CheckCircle2, label: "Fasting", value: "Not required", tone: "success" },
    {
      icon: test.recommendedFor === "BOTH" ? Users : User,
      label: "Recommended For",
      value:
        test.recommendedFor === "BOTH"
          ? "Everyone"
          : test.recommendedFor === "MALE"
            ? "Male"
            : "Female",
    },
  ];

  if (test.recommendedAge) {
    facts.push({ icon: Calendar, label: "Recommended Age", value: test.recommendedAge });
  }

  return facts;
}

/** Serves BOTH detail URL families — `/tests/{citySlug}/{testSlug}` for a
 *  real Test and `/parameter/{citySlug}/{testSlug}` for the shadow Test
 *  behind a directly-bookable Parameter — plus the city-less id fallback
 *  `/tests/{id}`. One component, because a bookable analyte IS a
 *  single-parameter Test behind the scenes (see `Test.sourceParameterId` on
 *  the backend): same API call, same layout, same add-to-cart path. */
function TestDetailPage() {
  const { id, citySlug, testSlug } = useParams<{
    id?: string;
    citySlug?: string;
    testSlug?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  // Which family the URL used — not necessarily the one the item belongs to,
  // which is what the canonicalising redirect below settles.
  const routeKind: CatalogDetailKind = location.pathname.startsWith("/parameter/")
    ? "parameter"
    : "tests";
  useSyncCityToRoute(routeKind, citySlug, testSlug);
  useAdoptCityFromRoute(citySlug);

  const { data: test, isLoading } = useQuery({
    queryKey:
      citySlug && testSlug ? ["test-detail", "city", citySlug, testSlug] : ["test-detail", id],
    queryFn: () =>
      citySlug && testSlug
        ? catalogApi.getTestDetailBySlug(citySlug, testSlug)
        : catalogApi.getTestDetail(id!),
    enabled: Boolean(id) || Boolean(citySlug && testSlug),
  });

  useTestSeoMeta(test);

  // Canonicalising redirect, both directions: a directly-bookable Parameter
  // opened at `/tests/{city}/{slug}` moves to `/parameter/{city}/{slug}`,
  // and a real Test opened at `/parameter/...` moves back to `/tests/...`.
  // Old links and anything already indexed under the other family keep
  // working, while only one URL per item stays live. `replace` so the
  // wrong-family URL doesn't sit in history and swallow the back button.
  const canonicalPath =
    test && citySlug && testSlug
      ? buildCatalogItemPath({
          kind: "tests",
          id: test.id,
          slug: test.slug,
          citySlug,
          isParameter: test.isParameter,
        })
      : null;
  const needsRedirect = canonicalPath !== null && canonicalPath !== location.pathname;

  useEffect(() => {
    if (needsRedirect && canonicalPath) navigate(canonicalPath, { replace: true });
  }, [canonicalPath, navigate, needsRedirect]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 pt-4 pb-28">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!test) {
    // Worded off the URL family, not the (unavailable) item — a dead
    // `/parameter/...` link shouldn't tell the patient a "test" is missing.
    const notFoundTitle = routeKind === "parameter" ? "Parameter not found" : "Test not found";
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <PageHeader title={notFoundTitle} />
        <EmptyState
          icon={FileSearch}
          title={notFoundTitle}
          description={`This ${routeKind === "parameter" ? "parameter" : "test"} may have been removed or the link is incorrect.`}
          actionLabel="Back to catalog"
          onAction={() => navigate("/tests")}
        />
      </div>
    );
  }

  const sellPrice = test.offerPrice ?? test.price;
  const hasDiscount = test.offerPrice != null && test.price > test.offerPrice;
  const discount = hasDiscount
    ? Math.round(((test.price - test.offerPrice!) / test.price) * 100)
    : 0;
  const added = addToCart.isSuccess;
  const facts = buildFacts(test);

  const priceBlock = (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-foreground">{formatRupees(sellPrice)}</span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatRupees(test.price)}
        </span>
      )}
    </div>
  );

  const ctaButton = (
    <Button
      size="lg"
      variant={added ? "secondary" : "default"}
      disabled={addToCart.isPending || added}
      onClick={() => addToCart.mutate({ type: "3", type_id: test.id })}
      className="w-full"
    >
      {addToCart.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : added ? (
        <motion.span
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5"
        >
          <Check className="size-4" /> Added to cart
        </motion.span>
      ) : (
        "Add to Cart"
      )}
    </Button>
  );

  return (
    <div className="mx-auto max-w-7xl pb-28 lg:pb-10">
      <PageHeader title={test.name} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="grid grid-cols-1 gap-6 px-4 pt-4 lg:grid-cols-[1fr_320px] lg:items-start"
      >
        <div className="min-w-0 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold leading-snug">
                  {test.name}
                  {test.city && <span className="ml-1.5">In {test.city.name}</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Test code: {test.shortName}</p>
              </div>
              {discount > 0 && <Badge variant="success">{discount}% off</Badge>}
            </div>

            <div className="mt-4">{priceBlock}</div>

            {(test.appCategory || test.city) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {test.appCategory && (
                  <Badge variant="outline" className="gap-1">
                    <FolderTree className="size-3" />
                    {test.appCategory}
                  </Badge>
                )}
                {test.city && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="size-3" />
                    Home collection in {test.city.name}
                  </Badge>
                )}
              </div>
            )}
          </Card>

          <CatalogFactGrid facts={facts} />

          {test.content ? (
            <Card>
              <CardContent className="pt-5">
                <ExpandableRichContent html={test.content} />
              </CardContent>
            </Card>
          ) : (
            test.description && (
              <Card>
                <CardContent className="space-y-2 pt-5">
                  <h2 className="text-sm font-semibold">What this test checks</h2>
                  <p
                    className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: test.description }}
                  />
                </CardContent>
              </Card>
            )
          )}

          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <ListChecks className="size-4 text-primary" />
                  Parameters included
                </h2>
                <span className="text-xs text-muted-foreground">
                  {test.parameters.length} total
                </span>
              </div>
              {/* Folded past a dozen: a single test rarely runs long, but
                  the ones that do were pushing the prep notes and the CTA off
                  the screen on arrival. */}
              <ParameterList parameters={test.parameters} initialCount={12} />
            </CardContent>
          </Card>
        </div>

        {/* Sticky price/CTA sidebar — desktop only; mobile uses the fixed
            bottom bar below instead, same as the rest of the app's PDPs. */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 p-5">
            <p className="text-xs text-muted-foreground">Price</p>
            {priceBlock}
            {hasDiscount && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                You save {formatRupees(test.price - sellPrice)} ({discount}%)
              </p>
            )}
            <div className="mt-4">{ctaButton}</div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Clock className="size-3.5 text-primary" /> Report in {test.reportTime}
              </p>
              <p className="flex items-center gap-2">
                {test.isFastingRequired ? (
                  <UtensilsCrossed className="size-3.5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                {test.isFastingRequired
                  ? `Fasting required${test.fastingHours ? ` (${test.fastingHours}h)` : ""}`
                  : "No fasting required"}
              </p>
            </div>
          </Card>
        </aside>
      </motion.div>

      <div className="fixed inset-x-0 bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom))] z-30 border-t border-border bg-card/95 p-4 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">{formatRupees(sellPrice)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatRupees(test.price)}
                </span>
              )}
            </div>
          </div>
          <Button
            size="lg"
            variant={added ? "secondary" : "default"}
            disabled={addToCart.isPending || added}
            onClick={() => addToCart.mutate({ type: "3", type_id: test.id })}
            className="min-w-36"
          >
            {addToCart.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : added ? (
              <motion.span
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <Check className="size-4" /> Added to cart
              </motion.span>
            ) : (
              "Add to Cart"
            )}
          </Button>
        </div>
      </div>

      <FloatingCartBar stackAboveOwnCta />
    </div>
  );
}

export { TestDetailPage };
