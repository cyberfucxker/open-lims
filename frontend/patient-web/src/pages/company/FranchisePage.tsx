import {
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Network,
  Phone,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHero, Reveal, SectionHeading, StatTile } from "@/components/common/marketing";
import { useEmailHref } from "@/hooks/useEmailHref";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const WHATSAPP_HREF =
  "https://wa.me/919876543210?text=Hi,%20I'm%20interested%20in%20a%20franchise";

const MODELS: { icon: LucideIcon; tag: string; title: string; blurb: string; points: string[] }[] =
  [
    {
      icon: Building2,
      tag: "Model 1",
      title: "Point of Lab",
      blurb:
        "A fully-branded diagnostic lab under the lab's name — the complete setup, backed by our processes, technology and test menu.",
      points: ["Full lab branding", "Complete lab setup & SOPs", "Access to the full test menu"],
    },
    {
      icon: Network,
      tag: "Model 2",
      title: "Collection Centre",
      blurb:
        "A low-investment sample-collection point. Collect samples locally; processing and reporting run on Example Diagnostics Lab's network.",
      points: [
        "Low investment to start",
        "Home & walk-in collection",
        "Reports on Example Diagnostics Lab's network",
      ],
    },
  ];

const REASONS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: TrendingUp,
    title: "A trusted, growing brand",
    body: "Two decades of credibility with a network spanning 60+ cities across India and Nepal.",
  },
  {
    icon: Network,
    title: "End-to-end support",
    body: "Processes, technology, training and a 4,500+ test menu — so you can focus on your patients.",
  },
  {
    icon: HeartHandshake,
    title: "Affordable, quality care",
    body: "Certified quality delivered at an affordable cost — a proposition patients trust.",
  },
];

const STATS = [
  { value: "100+", label: "Franchise labs" },
  { value: "10K", label: "Pickup centres" },
  { value: "60+", label: "Cities" },
  { value: "4,500+", label: "Tests" },
];

const ELIGIBILITY = [
  "Prospective partner should be skilled in terms of business.",
  "A certified healthcare professional.",
  "Suitable space for a lab or collection centre.",
  "Commitment to Example Diagnostics Lab's quality standards.",
];

function FranchisePage() {
  const applyHref = useEmailHref("info@example.com", { subject: "Franchise Enquiry" });

  useSeoMeta({
    title: "Partner with Example Diagnostics Lab — Franchise Opportunities",
    description:
      "Bring trusted, affordable, certified diagnostics to your city — backed by two decades of experience and a nationwide network.",
    canonicalPath: "/franchise",
  });

  return (
    <div className="bg-background">
      <MarketingHero
        eyebrow="Franchise"
        title="Partner with Example Diagnostics Lab"
        subtitle="Bring trusted, affordable, certified diagnostics to your city — backed by two decades of experience and a nationwide network."
      />

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <StatTile value={s.value} label={s.label} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Franchise models */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <Reveal>
          <SectionHeading kicker="Two ways to partner" title="Choose your franchise model" />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {MODELS.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.08}>
              <Card className="group relative h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                <div
                  aria-hidden
                  className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/[0.06] blur-2xl transition-opacity group-hover:opacity-150"
                />
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <m.icon className="size-6" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{m.blurb}</p>
                  <ul className="space-y-2 pt-1">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why partner */}
      <section className="bg-accent/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <SectionHeading kicker="Why partner" title="Why partner with us" />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {REASONS.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.07}>
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <r.icon className="size-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{r.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <Reveal>
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="size-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Eligibility criteria</h2>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ELIGIBILITY.map((e) => (
                  <li
                    key={e}
                    className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {e}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-12 text-center text-primary-foreground">
            <div
              aria-hidden
              className="animate-float-slow absolute -top-16 -left-10 size-56 rounded-full bg-white/10 blur-3xl"
            />
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to open a franchise?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/85">
              Share your details and our team will guide you through investment, setup and
              onboarding — end to end.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <a href={applyHref} target="_blank" rel="noopener noreferrer">
                  Apply for a franchise <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                  <Phone className="size-4" />
                  Request a callback
                </a>
              </Button>
            </div>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/75">
              <MapPin className="size-3.5" />
              123 Example Street, Sample City, State 000000 · +91 98765 43210
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export { FranchisePage };
