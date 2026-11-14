import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Clock,
  CreditCard,
  FileSearch,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
  Star,
  Globe,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabDetail } from "@/hooks/queries/useNearbyLabs";

/** `ServiceCenter.centerType` codes, as patients should read them. */
const CENTER_TYPE_LABELS: Record<string, string> = {
  COLLECTION_CENTER: "Collection Center",
  LAB: "Lab",
};

function directionsHref(lat: string, long: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${long}`;
}

function to12Hour(time: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function LabDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lab, isLoading } = useLabDetail(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4 pb-28">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <PageHeader title="Lab not found" />
        <EmptyState
          icon={FileSearch}
          title="Lab not found"
          description="This lab may no longer be listed, or the link is incorrect."
          actionLabel="Back to Nearest Lab"
          onAction={() => navigate("/nearby-labs")}
        />
      </div>
    );
  }

  const mapSrc = `https://maps.google.com/maps?q=${lab.latitude},${lab.longitude}&output=embed`;
  const openTime = to12Hour(lab.opening_time);
  const closeTime = to12Hour(lab.closing_time);

  return (
    <div className="mx-auto max-w-3xl pb-28 md:pb-8">
      <PageHeader title={lab.center_name} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-4 px-4 pt-4"
      >
        {/* Header card */}
        <Card className="overflow-hidden p-0">
          {lab.center_image ? (
            <img
              src={lab.center_image}
              alt={lab.center_name}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground">
              <Building2 className="size-10 opacity-70" />
            </div>
          )}
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold leading-snug text-foreground">{lab.center_name}</p>
                {lab.center_type && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {CENTER_TYPE_LABELS[lab.center_type] ?? lab.center_type}
                  </p>
                )}
              </div>
              <Badge variant={lab.is_open ? "success" : "secondary"} className="shrink-0">
                {lab.is_open ? "Open now" : "Closed"}
              </Badge>
            </div>

            {lab.rating > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{lab.rating.toFixed(1)}</span>
                {lab.review_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({lab.review_count.toLocaleString("en-IN")}{" "}
                    {lab.review_count === 1 ? "review" : "reviews"})
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {lab.phone && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${lab.phone}`}>
                    <Phone className="size-4" />
                    Call
                  </a>
                </Button>
              )}
              <Button className="flex-1" asChild>
                <a
                  href={directionsHref(lab.latitude, lab.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="size-4" />
                  Directions
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info list */}
        <Card>
          <CardContent className="pt-5">
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{lab.address}</span>
              </li>
              {(openTime || closeTime) && (
                <li className="flex items-start gap-2.5 text-sm">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {openTime} – {closeTime}
                  </span>
                </li>
              )}
              {lab.phone && (
                <li className="flex items-start gap-2.5 text-sm">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                  <a
                    href={`tel:${lab.phone}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {lab.phone}
                  </a>
                </li>
              )}
              {lab.email && (
                <li className="flex items-start gap-2.5 text-sm">
                  <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                  <a
                    href={`mailto:${lab.email}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {lab.email}
                  </a>
                </li>
              )}
              {lab.website && (
                <li className="flex items-start gap-2.5 text-sm">
                  <Globe className="mt-0.5 size-4 shrink-0 text-primary" />
                  <a
                    href={lab.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {lab.website}
                  </a>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Facilities */}
        {lab.facilities.length > 0 && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" />
                Facilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {lab.facilities.map((f) => (
                  <Badge key={f} variant="outline">
                    {f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment methods */}
        {lab.payment_methods.length > 0 && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <CreditCard className="size-4 text-primary" />
                Payment methods
              </h2>
              <div className="flex flex-wrap gap-2">
                {lab.payment_methods.map((m) => (
                  <Badge key={m} variant="outline">
                    {m}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        <div className="h-56 overflow-hidden rounded-2xl border border-border shadow-sm">
          <iframe
            title={`${lab.center_name} location`}
            src={mapSrc}
            className="size-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 text-center">
          <p className="text-sm font-semibold text-foreground">Prefer we come to you instead?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Book a free home sample collection in a few taps.
          </p>
          <Button className="mt-4" onClick={() => navigate("/tests")}>
            Book Home Collection <ArrowRight className="size-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export { LabDetailPage };
