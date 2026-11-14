import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronDown,
  Clock,
  FileCheck2,
  FileText,
  House,
  MessageCircle,
  Phone,
  Plus,
  Syringe,
} from "lucide-react";

import { AuthDialog } from "@/components/auth/AuthDialog";
import centrePhoto from "@/assets/lab-centre.jpg";
import { CONTACT, WHATSAPP_HREF } from "@/components/home/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/queries/useCart";
import { useCities } from "@/hooks/queries/useCities";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { resolveUploadUrl } from "@/services/api/httpClient";
import { landingApi, type OfferPage as Offer } from "@/services/api/landingApi";
import { useCartStore } from "@/store/cartStore";
import { useCityStore } from "@/store/cityStore";
import { formatRupees } from "@/utils/format";
import type { PackageCatalogItem } from "@/types";

import { OfferFooter } from "./OfferFooter";
import { OfferHeader } from "./OfferHeader";
import { OfferPackageCard } from "./OfferPackageCard";
import { OfferVideos } from "./OfferVideos";

/**
 * `/offer/:slug` — an ad landing page from Superadmin (CMS → Landing Pages).
 *
 * A page of its own, outside the site's AppShell: own header and footer, no
 * site navigation. Only the banner, title, city and packages come from the
 * admin; the copy below is fixed. Add to cart works logged out — the login
 * sheet opens in place and the add completes after sign-in (`useAddToCart`).
 */

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Book in two minutes",
    body: "Pick a package, add the patient's details and choose a collection slot that suits you.",
  },
  {
    icon: Syringe,
    title: "Sample collected at home",
    body: "A trained phlebotomist visits your address in the slot you picked and collects the sample.",
  },
  {
    icon: FileText,
    title: "Report on your phone",
    body: "Doctor-verified reports you can download any time from the website or the app.",
  },
];

// The same three promises the city pages make (`CityTrustRow`).
const TRUST = [
  { icon: House, label: "Home sample collection" },
  { icon: FileCheck2, label: "Doctor-verified reports" },
  { icon: BadgeCheck, label: "Certified labs" },
];

// The same figures the main site's "Labs network" section states.
const STATS = [
  { value: "20+", label: "Years in diagnostics" },
  { value: "60+", label: "Cities served" },
  { value: "100+", label: "Network labs" },
  { value: "2500+", label: "Centres" },
];

const FAQS = [
  {
    q: "How does home sample collection work?",
    a: "After you book, a phlebotomist from our team visits your address in the slot you chose and collects the sample. The sample goes to our lab and your report is shared online.",
  },
  {
    q: "Do I need to fast before the test?",
    a: "Some tests need fasting — usually 10–12 hours, with water allowed. If you're unsure about your package, call us before your slot and we'll guide you.",
  },
  {
    q: "When will I get my report?",
    a: "Each package above shows its report time. Once ready, you can download the report from the website or the app.",
  },
  {
    q: "How do I pay?",
    a: "Pay online while booking, or choose to pay at the time of sample collection.",
  },
  {
    q: "Is there a home collection charge?",
    a: "A small collection charge may apply depending on your area. It is shown before you confirm your booking, so there are no surprises.",
  },
];

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

function Banner({ offer }: { offer: Offer }) {
  const desktop = resolveUploadUrl(offer.desktop_banner_url);
  const mobile = resolveUploadUrl(offer.mobile_banner_url) ?? desktop;
  if (!desktop && !mobile) return null;
  return (
    <picture className="block h-[50svh] min-h-60 w-full bg-secondary">
      {mobile && <source media="(max-width: 767px)" srcSet={mobile} />}
      <img
        src={desktop ?? mobile ?? undefined}
        alt={offer.title}
        className="size-full object-cover"
        fetchPriority="high"
      />
    </picture>
  );
}

function Shell({ cityName, children }: { cityName?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbfa]">
      <OfferHeader cityName={cityName} />
      {/* The login sheet for gated "Add to cart" — AppShell owns the site's
          copy, and this page lives outside AppShell. */}
      <AuthDialog />
      <main className="flex-1">{children}</main>
      <OfferFooter />
    </div>
  );
}

function Unavailable({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Offer
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-brand-navy">{heading}</h1>
      <p className="text-base leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/packages">
            See all packages <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href={CONTACT.phoneHref}>
            <Phone className="size-4" aria-hidden /> {CONTACT.phone}
          </a>
        </Button>
      </div>
    </section>
  );
}

function OfferPage() {
  const { slug = "" } = useParams();
  const queryClient = useQueryClient();
  const lastAddedAt = useCartStore((s) => s.lastAddedAt);
  const itemCount = useCartStore((s) => s.itemCount);
  const setCity = useCityStore((s) => s.setCity);
  const currentCityId = useCityStore((s) => s.city?.id);
  const { data: cities } = useCities();
  useCart(); // keeps the header's cart count in sync for a signed-in visitor
  useNoIndex();

  const {
    data: offer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["landing", slug],
    queryFn: () => landingApi.getOffer(slug),
    retry: (count, err) => !(err instanceof ApiRequestError && err.status === 404) && count < 2,
  });

  useSeoMeta({
    title: offer
      ? `${offer.title} | Example Diagnostics Lab`
      : "Offer | Example Diagnostics Lab",
    description: offer
      ? `${offer.title} — home sample collection in ${offer.city.name}. Book online with Example Diagnostics Lab.`
      : undefined,
  });

  // The page's city prices the cart and checks serviceability at checkout, so
  // an ad visitor browsing as some other city is switched to this one.
  useEffect(() => {
    if (!offer || offer.city.id === currentCityId) return;
    const city = cities?.find((c) => c.id === offer.city.id);
    if (city) setCity(city);
  }, [offer, cities, currentCityId, setCity]);

  // "Added to cart" state comes from the server's `is_added_to_cart`.
  useEffect(() => {
    if (lastAddedAt) queryClient.invalidateQueries({ queryKey: ["landing", slug] });
  }, [lastAddedAt, queryClient, slug]);

  // Figures for the price card — all derived from the live package prices.
  const summary =
    offer && offer.packages.length > 0
      ? {
          from: Math.min(...offer.packages.map((p) => p.offer_price)),
          maxSavingPct: Math.max(
            ...offer.packages.map((p) =>
              p.actual_price > 0
                ? Math.round(((p.actual_price - p.offer_price) / p.actual_price) * 100)
                : 0,
            ),
          ),
          parameters:
            offer.packages.length > 1
              ? `${Math.min(...offer.packages.map((p) => p.parameter_count))}–${Math.max(...offer.packages.map((p) => p.parameter_count))}`
              : String(offer.packages[0].parameter_count),
        }
      : null;

  const mostBookedId = offer?.packages.reduce<PackageCatalogItem | null>(
    (best, p) => (!best || p.booked_count > best.booked_count ? p : best),
    null,
  )?.id;

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-[50svh] min-h-60 w-full rounded-none" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="mt-8 h-56 w-full rounded-xl" />
        </div>
      </Shell>
    );
  }

  if (error || !offer) {
    return (
      <Shell>
        <Unavailable
          heading="This offer link isn't valid"
          body="It may have been mistyped or removed. You can still book any of our health packages."
        />
      </Shell>
    );
  }

  if (offer.state !== "LIVE") {
    return (
      <Shell cityName={offer.city.name}>
        <Unavailable
          heading={offer.state === "UPCOMING" ? "This offer starts soon" : "This offer has ended"}
          body={
            offer.state === "UPCOMING"
              ? "Check back shortly — or browse our health packages now."
              : "Thanks for your interest. Our regular health packages are still available for home collection."
          }
        />
      </Shell>
    );
  }

  return (
    <Shell cityName={offer.city.name}>
      <Banner offer={offer} />

      {/* Title + price summary */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_20rem] md:items-center md:gap-14 md:py-16">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Home sample collection · {offer.city.name}
            </p>
            <h1 className="text-[2rem] leading-[1.08] font-semibold tracking-tight text-balance text-brand-navy sm:text-5xl lg:text-[3.5rem]">
              {offer.title}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Book online and a trained phlebotomist collects the sample at your home. Download your
              doctor-verified report online.
            </p>
            <ul className="mt-1 flex flex-col gap-3 text-sm text-foreground sm:flex-row sm:flex-wrap sm:gap-x-7">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-navy/[0.07] text-brand-navy">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {summary && (
            <aside className="flex flex-col gap-5 rounded-2xl border border-border bg-[#fbfbfa] p-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {offer.packages.length > 1 ? "Packages from" : "Package price"}
                </p>
                <p className="mt-1 text-5xl font-semibold tracking-tight text-brand-navy tabular-nums">
                  {formatRupees(summary.from)}
                </p>
                {summary.maxSavingPct > 0 && (
                  <p className="mt-2 inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    Save up to {summary.maxSavingPct}% on MRP
                  </p>
                )}
              </div>
              <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Packages</dt>
                  <dd className="font-medium text-foreground">{offer.packages.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Parameters</dt>
                  <dd className="font-medium text-foreground tabular-nums">{summary.parameters}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Collection</dt>
                  <dd className="font-medium text-foreground">At home, {offer.city.name}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2">
                <Button asChild className="h-12 text-base">
                  <a href="#packages">
                    View packages <ChevronDown className="size-4" aria-hidden />
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 text-base">
                  <a href={CONTACT.phoneHref}>
                    <Phone className="size-4" aria-hidden /> Call to book
                  </a>
                </Button>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="scroll-mt-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl">
              {offer.packages.length === 1 ? "The package" : "Choose your package"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Prices for {offer.city.name}, including all listed tests.
            </p>
          </div>
          {offer.packages.length === 0 ? (
            <p className="rounded-xl border border-border bg-white p-6 text-muted-foreground">
              These packages aren't available in {offer.city.name} right now.{" "}
              <Link
                to="/packages"
                className="font-medium text-brand-navy underline underline-offset-4"
              >
                See all packages
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {offer.packages.map((pkg, i) => (
                <OfferPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  position={i + 1}
                  label={
                    offer.packages.length > 1 && pkg.id === mostBookedId
                      ? `Most booked in ${offer.city.name}`
                      : `Home sample collection in ${offer.city.name}`
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-[#f4f6f9]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Three simple steps
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
              How it works
            </h2>
          </div>

          <ol className="relative mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
            {/* The line that joins the three steps on desktop. */}
            <span
              aria-hidden
              className="absolute top-9 right-[16%] left-[16%] hidden border-t-2 border-dashed border-brand-navy/25 md:block"
            />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="relative flex gap-4 rounded-2xl border border-border bg-white p-5 md:flex-col md:items-center md:gap-5 md:p-7 md:text-center"
              >
                <div className="relative shrink-0">
                  <span className="flex size-14 items-center justify-center rounded-full bg-brand-navy text-white ring-8 ring-[#f4f6f9] md:size-[4.5rem]">
                    <Icon className="size-6 md:size-7" aria-hidden />
                  </span>
                  <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <OfferVideos />
        </div>
      </section>

      {/* The lab */}
      <section className="bg-[#fbfbfa]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-16">
          {/* Portrait photo — a tall frame keeps the whole building and the
              signboard in view instead of cropping them. */}
          <figure className="mx-auto w-full max-w-md overflow-hidden rounded-2xl md:max-w-none">
            <img
              src={centrePhoto}
              alt="Example Diagnostics Lab building"
              loading="lazy"
              width={960}
              height={1280}
              className="aspect-[4/5] w-full object-cover object-[50%_40%]"
            />
          </figure>
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              From your home to our lab
            </p>
            <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance text-brand-navy sm:text-4xl">
              Every report is checked by a doctor before it reaches you
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Your sample is processed at our lab, and the report is verified by a doctor before it
              is released. You can download it from the website or the app whenever you need it.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild variant="outline" className="h-11">
                <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" aria-hidden /> Ask on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="bg-brand-navy text-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 border-l border-white/15 pl-5">
              <dt className="order-2 text-sm text-white/70">{s.label}</dt>
              <dd className="order-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section className="bg-[#fbfbfa]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[22rem_1fr] md:gap-14">
          <div className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">FAQs</p>
              <h2 className="text-2xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
                Questions, answered
              </h2>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl bg-brand-navy p-6 text-white">
              <p className="text-lg font-semibold">Still have a question?</p>
              <p className="text-sm leading-relaxed text-white/75">
                Talk to our team — we'll help you pick the right package for {offer.city.name}.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="h-11 bg-white text-brand-navy hover:bg-white/90">
                  <a href={CONTACT.phoneHref}>
                    <Phone className="size-4" aria-hidden /> {CONTACT.phone}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" aria-hidden /> Chat on WhatsApp
                  </a>
                </Button>
              </div>
              <p className="flex items-center gap-2 text-xs text-white/60">
                <Clock className="size-3.5" aria-hidden /> {CONTACT.hours}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="group rounded-xl border border-border bg-white transition-colors open:border-brand-navy/30 open:shadow-[0_1px_0_rgba(30,65,105,0.06)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-medium text-foreground sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-brand-navy transition-colors group-open:bg-brand-navy group-open:text-white">
                    <Plus
                      className="size-4 transition-transform duration-200 group-open:rotate-45"
                      aria-hidden
                    />
                  </span>
                </summary>
                <p className="-mt-1 px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile checkout bar once something is in the cart */}
      {itemCount > 0 && (
        <>
          <div className="h-20 md:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white p-3 md:hidden">
            <Button asChild className="h-12 w-full text-base">
              <Link to="/cart">
                {itemCount} in cart · Checkout <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </>
      )}
    </Shell>
  );
}

export { OfferPage };
