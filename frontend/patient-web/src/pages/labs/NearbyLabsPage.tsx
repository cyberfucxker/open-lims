import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, CalendarPlus, Navigation, Phone, Search, ShieldCheck } from "lucide-react";

import { PageHero, PageHeroChip } from "@/components/common/PageHero";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNearbyLabs } from "@/hooks/queries/useNearbyLabs";
import { useCityStore } from "@/store/cityStore";
import type { CenterListItem } from "@/types";

function directionsHref(lat: string, long: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${long}`;
}

function LabCard({
  lab,
  index,
  onOpen,
  onBookNow,
}: {
  lab: CenterListItem;
  index: number;
  onOpen: () => void;
  onBookNow: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
    >
      <Card className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                {lab.center_name}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{lab.address}</p>
            </button>
            <Badge variant={lab.is_open ? "success" : "secondary"} className="shrink-0">
              {lab.is_open ? "Open now" : "Closed"}
            </Badge>
          </div>

          <div className="flex items-center justify-end pt-1">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                onClick={onBookNow}
                aria-label={`Book now at ${lab.center_name}`}
              >
                <CalendarPlus className="size-3.5" />
                Book Now
              </Button>
              {lab.phone && (
                <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
                  <a href={`tel:${lab.phone}`} aria-label={`Call ${lab.center_name}`}>
                    <Phone className="size-3.5" />
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 px-2.5" asChild>
                <a
                  href={directionsHref(lab.lat, lab.long)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Get directions to ${lab.center_name}`}
                >
                  <Navigation className="size-3.5" />
                </a>
              </Button>
              <Button size="sm" className="h-8" onClick={onOpen}>
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LabCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-4 h-8 w-full" />
    </div>
  );
}

function NearbyLabsPage() {
  const navigate = useNavigate();
  const city = useCityStore((s) => s.city);
  const [search, setSearch] = useState("");

  // City-center fallback: sorts labs nearest-first from the selected city
  // (rather than the device's live GPS, which nothing on this page requests
  // anymore) — labs in that city naturally land at the top, then the rest
  // ordered by distance from it.
  const cityCoords =
    city?.latitude != null && city?.longitude != null
      ? { lat: city.latitude, long: city.longitude }
      : undefined;

  const { data, isLoading, isError, refetch } = useNearbyLabs(cityCoords);

  const filtered = useMemo(() => {
    const labs = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return labs;
    return labs.filter(
      (l) => l.center_name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="pb-10">
      <PageHero
        eyebrow={
          <PageHeroChip icon={<ShieldCheck className="size-3.5" />}>Accredited labs</PageHeroChip>
        }
        title="Nearest Lab"
        description="Find a diagnostic centre near you for a walk-in visit, sample drop-off, or report pickup."
      />

      <div className="mx-auto max-w-5xl px-4 pt-5">
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by lab name or area..."
            className="h-11 pl-9"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <LabCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Building2}
            title="Couldn't load labs"
            description="Something went wrong while fetching nearby labs."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No labs found"
            description={
              search ? "Try a different search term." : "There are no labs listed just yet."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((lab, i) => (
              <LabCard
                key={lab.id}
                lab={lab}
                index={i}
                onOpen={() => navigate(`/nearby-labs/${lab.id}`)}
                onBookNow={() => navigate(`/book-home-visit?labId=${lab.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { NearbyLabsPage };
