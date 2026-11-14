import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { AppleGlyph, GooglePlayGlyph } from "@/components/brand/StoreGlyphs";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/appLinks";
import { useCities } from "@/hooks/queries/useCities";
import { useEmailHref } from "@/hooks/useEmailHref";
import { getHome } from "@/services/api/homeApi";
import { useCityStore } from "@/store/cityStore";
import { buildCatalogItemPath, buildCityPath } from "@/utils/routes";
import { FOOTER_LEGAL_LINKS } from "@/mocks/data/homeContent";

/* ------------------------------------------------------------------ */
/* Footer content — sourced from example.com                          */
/* ------------------------------------------------------------------ */

const COMPANY_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "Careers", to: "/careers" },
  { label: "Contact Us", to: "/contact" },
  { label: "Feedback/Complaints", to: "/feedback" },
];

const SOCIALS: { id: string; label: string; href: string; Icon: LucideIcon }[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/example", Icon: Facebook },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/example",
    Icon: Instagram,
  },
  { id: "twitter", label: "Twitter", href: "https://twitter.com/example", Icon: Twitter },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/example/",
    Icon: Linkedin,
  },
];

export const WHATSAPP_HREF = "https://wa.me/919876543210?text=hi";

export const CONTACT = {
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "info@example.com",
  address:
    "123 Example Street, Sample City, State 000000",
  hours: "Mon – Sun: 6:00 AM – 10:00 PM",
};

/* ------------------------------------------------------------------ */
/* Brand glyph (store glyphs live in `@/components/brand/StoreGlyphs`) */
/* ------------------------------------------------------------------ */

function WhatsAppGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" className={className} fill="currentColor" aria-hidden>
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-71.2-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to?: string; href?: string }>;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-3.5">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center text-sm text-white transition-colors hover:text-white"
              >
                <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:mr-2 group-hover:w-3" />
                {link.label}
              </a>
            ) : (
              <Link
                to={link.to ?? "#"}
                className="group inline-flex items-center text-sm text-white transition-colors hover:text-white"
              >
                <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:mr-2 group-hover:w-3" />
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/** One "heading + inline rule + wrapped, `separator`-joined link list" row —
 *  the SEO link-farm block (Our Presence / Popular Tests / Popular Packages),
 *  each fed from a real API list rather than a hard-coded one, so it never
 *  drifts from what Superadmin actually has live. Renders nothing while its
 *  list is empty (still loading, or genuinely nothing to show) rather than an
 *  empty heading.
 *
 *  Drives its own reveal rather than inheriting one from a parent, and has
 *  to: returning `null` until its data lands means all three of these mount
 *  *after* the footer has usually already scrolled into view, and a variant
 *  driven by a parent's `whileInView` — a gesture, not `animate` — does not
 *  propagate to children that mount once it has fired. They stayed at
 *  `hidden`, so the whole link block rendered as a tall band of empty navy.
 *  A reload hid it: React Query serves the lists from cache, the sections
 *  exist at first paint, and the parent's stagger reached them normally. */
function SeoLinkSection({
  title,
  items,
  separator = " / ",
}: {
  title: string;
  items: Array<{ label: string; to: string }>;
  separator?: string;
}) {
  if (items.length === 0) return null;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="py-4"
    >
      <div className="mb-3 flex items-center gap-4">
        <h3 className="shrink-0 text-base font-bold text-white sm:text-lg">{title}</h3>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-white/20" />
      </div>
      <p className="text-sm leading-relaxed text-white">
        {items.map((item, i) => (
          <span key={item.to}>
            <Link
              to={item.to}
              className="underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {item.label}
            </Link>
            {i < items.length - 1 ? separator : ""}
          </span>
        ))}
      </p>
    </motion.div>
  );
}

function AppBadge({
  href,
  glyph,
  top,
  store,
}: {
  href: string;
  glyph: React.ReactNode;
  top: string;
  store: string;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.08] px-3.5 py-2 text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/[0.16]"
    >
      <span className="text-white">{glyph}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] text-white">{top}</span>
        <span className="text-sm font-semibold">{store}</span>
      </span>
    </motion.a>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.25 }}
          className="fixed right-5 bottom-[calc(var(--bottom-tab-bar-height)+var(--safe-area-bottom)+1.25rem)] z-40 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 md:bottom-6"
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function SiteFooter() {
  // Fed from real data, not a hard-coded city/test/package list, so this
  // block never drifts from what's actually live in Superadmin — cities from
  // the same `GET /master/cities` the location picker uses, tests/packages
  // from `GET /user/home`'s "popular" lists (same `["home", cityId]` query
  // key `HomePage` uses, so this is a second render of already-fetched data
  // there, not a second request — the key has to match exactly, cityId
  // included, or this misses that cache and fires a redundant fetch).
  const { data: cities } = useCities();
  // Desktop browsers rarely have a mail client configured, so a plain
  // `mailto:` there just looks like a dead button — see `useEmailHref`.
  const emailHref = useEmailHref(CONTACT.email);
  const cityId = useCityStore((s) => s.city?.id);
  const { data: home } = useQuery({
    queryKey: ["home", cityId ?? null],
    queryFn: () => getHome(cityId),
  });
  // Detail links carry the picked city the same way `TestCard`/`PackageCard`
  // do — nicer SEO url when one's selected, plain id-based fallback otherwise.
  const citySlug = useCityStore((s) => s.city?.slug);

  const cityLinks = (cities ?? []).map((city) => ({
    label: city.name,
    to: buildCityPath(city.slug),
  }));
  const testLinks = (home?.tests ?? []).map((test) => ({
    label: test.test_name,
    to: buildCatalogItemPath({
      kind: "tests",
      id: test.id,
      slug: test.slug,
      citySlug,
      isParameter: test.is_parameter,
    }),
  }));
  const packageLinks = (home?.packages ?? []).map((pkg) => ({
    label: pkg.package_name,
    to: buildCatalogItemPath({ kind: "packages", id: pkg.id, slug: pkg.slug, citySlug }),
  }));

  return (
    <footer className="relative overflow-hidden bg-brand-navy text-white">
      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-8 sm:pt-16">
        {/* SEO link-farm — Our Presence / Popular Tests / Popular Packages.
            Sits above the brand/company/legal/contact grid, same position as
            the reference layout. */}
        {/* A plain wrapper: each `SeoLinkSection` reveals itself now (see its
            doc-comment), so there is no parent gesture left to stagger. */}
        <div className="mb-10 divide-y divide-white/10 border-y border-white/10">
          <SeoLinkSection title="Our Presence" items={cityLinks} separator=" / " />
          <SeoLinkSection title="Browse Popular Blood Tests" items={testLinks} separator=" / " />
          <SeoLinkSection
            title="Browse Popular Blood Packages"
            items={packageLinks}
            separator=", "
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]"
        >
          {/* Brand + social + app badges */}
          <motion.div variants={itemVariants} className="space-y-5">
            <Logo variant="white" className="h-9" />
            <p className="max-w-xs text-sm leading-relaxed text-white">
              Example Diagnostics Lab brings accurate, affordable lab tests and health packages
              to your doorstep — with certified quality you can trust.
            </p>

            <div className="flex items-center gap-2">
              {SOCIALS.map((social) => (
                <motion.a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={{ y: -3, scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-primary hover:text-white"
                >
                  <social.Icon className="size-4" />
                </motion.a>
              ))}
              <motion.a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                whileHover={{ y: -3, scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-emerald-500 hover:text-white"
              >
                <WhatsAppGlyph />
              </motion.a>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold tracking-wide text-white uppercase">
                Download our app
              </p>
              <div className="flex flex-wrap gap-2.5">
                <AppBadge
                  href={APP_STORE_URL}
                  glyph={<AppleGlyph />}
                  top="Download on the"
                  store="App Store"
                />
                <AppBadge
                  href={PLAY_STORE_URL}
                  glyph={<GooglePlayGlyph />}
                  top="GET IT ON"
                  store="Google Play"
                />
              </div>
            </div>
          </motion.div>

          {/* Company + Legal sit side by side even on mobile, where the
              outer grid is a single column — `contents` at `sm:` and up
              hands them back to the outer grid as its own two columns,
              matching the pre-existing desktop/tablet layout untouched. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:contents">
            {/* Company (replaces the old Quick Links) */}
            <FooterLinkColumn title="Company" links={COMPANY_LINKS} />

            {/* Legal (replaces the old Tests & Packages column) */}
            <FooterLinkColumn title="Legal" links={FOOTER_LEGAL_LINKS} />
          </div>

          {/* Contact */}
          <motion.div variants={itemVariants} className="space-y-3.5">
            <h3 className="text-sm font-bold text-white">Get in touch</h3>
            <ul className="space-y-3 text-sm text-white">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <a
                  href={CONTACT.phoneHref}
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <a
                  href={emailHref}
                  target={emailHref.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{CONTACT.hours}</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Legal links now live in the column above; this stays a plain
            copyright line so they aren't listed twice. */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white">
            © {new Date().getFullYear()} Example Diagnostics Lab. All rights reserved.
          </p>
        </div>
      </div>

      <ScrollToTopButton />
    </footer>
  );
}

export { SiteFooter };
