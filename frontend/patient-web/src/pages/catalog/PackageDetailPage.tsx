import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplet,
  FileSearch,
  FlaskConical,
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
import { IncludedTests } from "@/components/catalog/IncludedTests";
import { ParameterList } from "@/components/catalog/ParameterList";
import { CatalogFactGrid, type CatalogFact } from "@/components/catalog/CatalogFactGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddToCart } from "@/hooks/queries/useCart";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { useAdoptCityFromRoute } from "@/hooks/useAdoptCityFromRoute";
import { useSyncCityToRoute } from "@/hooks/useSyncCityToRoute";
import { catalogApi } from "@/services/api/catalogApi";
import type { PackageDetail } from "@/types";

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** See `TestDetailPage.tsx`'s `useTestSeoMeta` — same rules, package twin. */
function usePackageSeoMeta(pkg: PackageDetail | undefined) {
  const city = pkg?.city;
  const price = pkg ? (pkg.offerPrice ?? pkg.price) : 0;
  const description = pkg?.description
    ? stripHtml(pkg.description).slice(0, 155)
    : pkg
      ? `Book ${pkg.name}${city ? ` in ${city.name}` : ""} with free home sample collection.${pkg.reportTime ? ` Reports in ${pkg.reportTime}.` : ""}`
      : undefined;

  useSeoMeta({
    title: pkg
      ? city
        ? `${pkg.name} in ${city.name} — Book Online | Example Diagnostics Lab`
        : `${pkg.name} | Example Diagnostics Lab`
      : "Example Diagnostics Lab",
    description,
    canonicalPath: pkg
      ? city
        ? `/packages/${city.slug}/${pkg.slug}`
        : `/packages/${pkg.id}`
      : undefined,
    jsonLd: pkg
      ? {
          "@context": "https://schema.org",
          "@type": "MedicalTest",
          name: pkg.name,
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

/** Same fact-tile set the Test detail page shows — `PackageDetail` has
 *  always carried these prep fields, this just presents them the same way. */
function buildFacts(pkg: PackageDetail): CatalogFact[] {
  const facts: CatalogFact[] = [
    {
      icon: ListChecks,
      label: "Parameters",
      value: `${pkg.parameters.length || pkg.tests.length}`,
    },
  ];

  if (pkg.tests.length > 0) {
    facts.push({ icon: FlaskConical, label: "Tests Included", value: `${pkg.tests.length}` });
  }
  if (pkg.reportTime) {
    facts.push({ icon: Clock, label: "Report Time", value: pkg.reportTime });
  }
  if (pkg.sampleType) {
    facts.push({ icon: Droplet, label: "Sample Type", value: pkg.sampleType });
  }

  facts.push(
    pkg.isFastingRequired
      ? {
          icon: UtensilsCrossed,
          label: "Fasting",
          value: pkg.fastingHours ? `${pkg.fastingHours}h required` : "Required",
          tone: "warning",
        }
      : { icon: CheckCircle2, label: "Fasting", value: "Not required", tone: "success" },
  );

  facts.push({
    icon: pkg.recommendedFor === "BOTH" ? Users : User,
    label: "Recommended For",
    value:
      pkg.recommendedFor === "BOTH"
        ? "Everyone"
        : pkg.recommendedFor === "MALE"
          ? "Male"
          : "Female",
  });

  if (pkg.recommendedAge) {
    facts.push({ icon: Calendar, label: "Recommended Age", value: pkg.recommendedAge });
  }

  return facts;
}

function PackageDetailPage() {
  const { id, citySlug, packageSlug } = useParams<{
    id?: string;
    citySlug?: string;
    packageSlug?: string;
  }>();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  useSyncCityToRoute("packages", citySlug, packageSlug);
  // Arriving on `/packages/{citySlug}/…` adopts that city as the selected
  // one, so the location pill and every other page agree with the price
  // this one is showing — see the hook's doc-comment.
  useAdoptCityFromRoute(citySlug);
  const { data: pkg, isLoading } = useQuery({
    queryKey:
      citySlug && packageSlug
        ? ["package-detail", "city", citySlug, packageSlug]
        : ["package-detail", id],
    queryFn: () =>
      citySlug && packageSlug
        ? catalogApi.getPackageDetailBySlug(citySlug, packageSlug)
        : catalogApi.getPackageDetail(id!),
    enabled: Boolean(id) || Boolean(citySlug && packageSlug),
  });

  usePackageSeoMeta(pkg);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 pt-4 pb-28">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <PageHeader title="Package not found" />
        <EmptyState
          icon={FileSearch}
          title="Package not found"
          description="This package may have been removed or the link is incorrect."
          actionLabel="Back to catalog"
          onAction={() => navigate("/tests")}
        />
      </div>
    );
  }

  const sellPrice = pkg.offerPrice ?? pkg.price;
  const hasDiscount = pkg.offerPrice != null && pkg.price > pkg.offerPrice;
  const discount = hasDiscount ? Math.round(((pkg.price - pkg.offerPrice!) / pkg.price) * 100) : 0;
  const added = addToCart.isSuccess;
  const facts = buildFacts(pkg);

  const priceBlock = (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-foreground">{formatRupees(sellPrice)}</span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatRupees(pkg.price)}
        </span>
      )}
    </div>
  );

  const ctaButton = (
    <Button
      size="lg"
      variant={added ? "secondary" : "default"}
      disabled={addToCart.isPending || added}
      onClick={() => addToCart.mutate({ type: "1", type_id: pkg.id })}
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
      <PageHeader title={pkg.name} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="grid grid-cols-1 gap-6 px-4 pt-4 lg:grid-cols-[1fr_320px] lg:items-start"
      >
        <div className="min-w-0 space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold leading-snug">
                {pkg.name}
                {pkg.city && <span className="ml-1.5">In {pkg.city.name}</span>}
              </p>
              {discount > 0 && <Badge variant="success">{discount}% off</Badge>}
            </div>

            <div className="mt-4">{priceBlock}</div>

            {(pkg.appCategory || pkg.city) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pkg.appCategory && (
                  <Badge variant="outline" className="gap-1">
                    <FolderTree className="size-3" />
                    {pkg.appCategory}
                  </Badge>
                )}
                {pkg.city && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="size-3" />
                    Home collection in {pkg.city.name}
                  </Badge>
                )}
              </div>
            )}
          </Card>

          <CatalogFactGrid facts={facts} />

          {pkg.description && (
            <Card>
              <CardContent className="space-y-2 pt-5">
                <h2 className="text-sm font-semibold">About this package</h2>
                <p
                  className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: pkg.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* One card, not two. It used to be "Tests included" followed by
              every analyte in the package in a second flat block — the two
              together filled several screens on arrival, and nothing said
              which analyte came from which test. */}
          {(pkg.tests.length > 0 || pkg.parameters.length > 0) && (
            <Card>
              <CardContent className="pt-5">
                {pkg.tests.length > 0 ? (
                  <IncludedTests
                    tests={pkg.tests}
                    standaloneParameters={pkg.standaloneParameters}
                    totalParameters={pkg.parameters.length}
                  />
                ) : (
                  // A package built straight from analytes, with no member
                  // tests to group them under.
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                        <ListChecks className="size-4 text-primary" />
                        Parameters included
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {pkg.parameters.length} total
                      </span>
                    </div>
                    <ParameterList parameters={pkg.parameters} initialCount={8} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sticky price/CTA sidebar — desktop only; mobile uses the fixed
            bottom bar below instead, same as the rest of the app's PDPs. */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 p-5">
            <p className="text-xs text-muted-foreground">Price</p>
            {priceBlock}
            {hasDiscount && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                You save {formatRupees(pkg.price - sellPrice)} ({discount}%)
              </p>
            )}
            <div className="mt-4">{ctaButton}</div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              {pkg.reportTime && (
                <p className="flex items-center gap-2">
                  <Clock className="size-3.5 text-primary" /> Report in {pkg.reportTime}
                </p>
              )}
              <p className="flex items-center gap-2">
                {pkg.isFastingRequired ? (
                  <UtensilsCrossed className="size-3.5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                {pkg.isFastingRequired
                  ? `Fasting required${pkg.fastingHours ? ` (${pkg.fastingHours}h)` : ""}`
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
                  {formatRupees(pkg.price)}
                </span>
              )}
            </div>
          </div>
          <Button
            size="lg"
            variant={added ? "secondary" : "default"}
            disabled={addToCart.isPending || added}
            onClick={() => addToCart.mutate({ type: "1", type_id: pkg.id })}
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

export { PackageDetailPage };
