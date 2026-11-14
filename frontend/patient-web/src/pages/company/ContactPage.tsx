import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageSquareHeart,
  Phone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHero, Reveal, SectionHeading } from "@/components/common/marketing";
import { useEmailHref } from "@/hooks/useEmailHref";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const PHONE = "+91 98765 43210";
const PHONE_HREF = "tel:+919876543210";
const WHATSAPP_HREF = "https://wa.me/919876543210?text=hi";
const EMAIL = "info@example.com";
const ADDRESS =
  "123 Example Street, Sample City, State 000000";
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;

function ContactPage() {
  // Desktop browsers rarely have a mail client configured, so a plain
  // `mailto:` there just looks like a dead button — see `useEmailHref`.
  const emailHref = useEmailHref(EMAIL);

  const channels: { icon: LucideIcon; title: string; value: string; href: string; cta: string }[] =
    [
      { icon: Phone, title: "Call us", value: PHONE, href: PHONE_HREF, cta: "Call now" },
      {
        icon: MessageSquareHeart,
        title: "WhatsApp",
        value: "Chat with support",
        href: WHATSAPP_HREF,
        cta: "Start chat",
      },
      { icon: Mail, title: "Email us", value: EMAIL, href: emailHref, cta: "Send email" },
    ];

  useSeoMeta({
    title: "Contact Us | Example Diagnostics Lab",
    description:
      "Questions about a test, an order, or a franchise? Reach Example Diagnostics Lab by call, WhatsApp, email, or visit our lab.",
    canonicalPath: "/contact",
  });

  return (
    <div className="bg-background">
      <MarketingHero
        eyebrow="Contact Us"
        title="We're here to help"
        subtitle="Questions about a test, an order, or a franchise? Reach us however's easiest — call, WhatsApp, email, or visit our lab."
      />

      {/* Channel cards */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {channels.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.07}>
              <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="flex h-full flex-col gap-4 pt-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <c.icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.value}</p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                    >
                      {c.cta} <ArrowRight className="size-3.5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Address + map */}
      <section className="bg-accent/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <SectionHeading kicker="Visit us" title="Our principal laboratory" />
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
            <Reveal>
              <Card className="h-full">
                <CardContent className="space-y-5 pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Example Diagnostics Lab
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">Principal laboratory</p>
                    </div>
                  </div>

                  <ul className="space-y-3.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      {ADDRESS}
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                      Mon – Sun: 6:00 AM – 10:00 PM
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                      <a href={PHONE_HREF} className="hover:text-foreground hover:underline">
                        {PHONE}
                      </a>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                      <a
                        href={emailHref}
                        target={emailHref.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="hover:text-foreground hover:underline"
                      >
                        {EMAIL}
                      </a>
                    </li>
                  </ul>

                  <Button className="w-full" asChild>
                    {/* The `dir`/directions endpoint resolves a text address
                        to a single destination for routing; `maps/search`
                        (the old link) is built for exploring a result list
                        and can surface a same-named place in the wrong
                        city instead of this exact address. */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get directions <ArrowRight className="size-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="h-72 overflow-hidden rounded-2xl border border-border shadow-sm lg:h-full">
                <iframe
                  title="Example Diagnostics Lab location"
                  src={MAP_EMBED_SRC}
                  className="size-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Feedback CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-12 text-center text-primary-foreground">
            <div
              aria-hidden
              className="animate-float-slow absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-3xl"
            />
            <h2 className="text-2xl font-bold sm:text-3xl">Have a complaint or feedback?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/85">
              Use our Feedback / Complaints form for anything that needs to be tracked and resolved
              by our team.
            </p>
            <div className="mt-7 flex justify-center">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link to="/feedback">
                  Go to Feedback / Complaints <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export { ContactPage };
