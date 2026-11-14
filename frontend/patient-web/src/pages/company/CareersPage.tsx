import {
  ArrowRight,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHero, Reveal, SectionHeading, StatTile } from "@/components/common/marketing";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const CAREERS_EMAIL = "info@example.com";
const MAILTO = `mailto:${CAREERS_EMAIL}?subject=Job%20Application%20-%20Example%20Diagnostics%20Lab`;

const VALUES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: HeartPulse,
    title: "Purpose-driven work",
    body: "Every role — from the lab bench to the field — directly improves health outcomes for lakhs of patients.",
  },
  {
    icon: Rocket,
    title: "Grow fast",
    body: "A rapidly expanding network across 60+ cities means real ownership and room to advance quickly.",
  },
  {
    icon: GraduationCap,
    title: "Learn from the best",
    body: "Work alongside expert pathologists, microbiologists and healthcare leaders with decades of experience.",
  },
  {
    icon: Sparkles,
    title: "Innovation-first",
    body: "Cutting-edge automation, PCR and flow cytometry — we invest in technology and the people who run it.",
  },
];

const STATS = [
  { value: "2500+", label: "Centres" },
  { value: "60+", label: "Cities" },
  { value: "2 Decades", label: "Of trust" },
  { value: "25M+", label: "Samples tested" },
];

const TEAMS = [
  "Lab Technicians & Technologists",
  "Pathologists & Microbiologists",
  "Phlebotomists",
  "Sales & Business Development",
  "Customer Support",
  "Operations & Logistics",
];

function CareersPage() {
  useSeoMeta({
    title: "Careers at Example Diagnostics Lab — Build a Healthier India",
    description:
      "Join a team that's redefining diagnostics across the country — where your work has real impact and your career grows as fast as we do.",
    canonicalPath: "/careers",
  });

  return (
    <div className="bg-background">
      <MarketingHero
        eyebrow="Careers"
        title="Build a healthier India with us"
        subtitle="Join a team that's redefining diagnostics across the country — where your work has real impact and your career grows as fast as we do."
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

      {/* Why join */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <Reveal>
          <SectionHeading kicker="Why join us" title="Life at our lab" />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={(i % 4) * 0.06}>
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <v.icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Teams we hire for */}
      <section className="bg-accent/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <SectionHeading kicker="Opportunities" title="Teams we hire for" />
          </Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {TEAMS.map((t, i) => (
              <Reveal key={t} delay={(i % 3) * 0.05}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <Users className="size-4 text-primary" />
                  {t}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-12 text-center text-primary-foreground">
            <div
              aria-hidden
              className="animate-float absolute -right-10 -bottom-16 size-56 rounded-full bg-white/10 blur-3xl"
            />
            <h2 className="text-2xl font-bold sm:text-3xl">Don't see your role listed?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/85">
              We're always looking for talented, driven people. Send us your CV and we'll reach out
              when a matching opportunity opens up.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <a href={MAILTO}>
                  Send your resume <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a href={`mailto:${CAREERS_EMAIL}`}>
                  <Mail className="size-4" />
                  {CAREERS_EMAIL}
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

export { CareersPage };
