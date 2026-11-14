import { useNavigate } from "react-router-dom";
import { Compass, Handshake, ShieldCheck, Target, Telescope, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHero, Reveal, SectionHeading, StatTile } from "@/components/common/marketing";
import { useSeoMeta } from "@/hooks/useSeoMeta";

/** Sample "About" page. Every figure, name and claim below is placeholder
 *  content for the demo lab — replace it with your own organisation's story
 *  (or move it into the CMS pages managed from the Superadmin app). */

const PHOTOS = {
  leadership: ["/team-member-ceo.png", "/team-member-cfo.png", "/team-member-coo.png"],
  networkMap: "/lab-network-map.png",
};

const STATS = [
  { value: "100K+", label: "Tests conducted" },
  { value: "25K+", label: "Patients served" },
  { value: "50+", label: "Collection centres" },
  { value: "500+", label: "Tests offered" },
];

const VISION_MISSION: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Telescope,
    title: "Vision",
    body: "To make pathologists part of the treating team, so patients benefit from continuous interaction with clinicians.",
  },
  {
    icon: Compass,
    title: "Mission",
    body: "To deliver accurate, dependable results at an affordable cost, right at your doorstep, with minimum turnaround time.",
  },
];

const VALUES: { icon: LucideIcon; title: string; points: string[] }[] = [
  {
    icon: Handshake,
    title: "Genuine care",
    points: [
      "Trained staff for pain-free sample collection.",
      "A hassle-free experience end to end.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Quality first",
    points: ["Multi-level checking before reports are released.", "Documented, audited processes."],
  },
  {
    icon: Target,
    title: "Strive for zero error",
    points: [
      "Centralised software for precise diagnostic support.",
      "Best-practice sample handling.",
    ],
  },
  {
    icon: Zap,
    title: "Keep improving",
    points: [
      "Continuously widening our test menu.",
      "Listening to feedback from patients and clinicians.",
    ],
  },
];

const TEAM = [
  { photo: PHOTOS.leadership[0], name: "Jane Doe", role: "Chief Executive Officer" },
  { photo: PHOTOS.leadership[1], name: "John Smith", role: "Chief Financial Officer" },
  { photo: PHOTOS.leadership[2], name: "Alex Example", role: "Chief Operating Officer" },
];

function AboutPage() {
  const navigate = useNavigate();

  useSeoMeta({
    title: "About Us | Example Diagnostics Lab",
    description:
      "Accurate, affordable lab testing and preventive health checkups, delivered with certified quality right to your doorstep.",
    canonicalPath: "/about",
  });

  return (
    <div className="bg-background">
      <MarketingHero
        eyebrow="About Us"
        title="Dependable diagnostics for every family"
        subtitle="Accurate, affordable lab testing and preventive health checkups, delivered right to your doorstep."
      />

      <section className="mx-auto max-w-4xl space-y-12 px-4 py-10 sm:py-14">
        <Reveal>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Example Diagnostics Lab is a fictional diagnostic laboratory used to demonstrate Open
            LIMS. Replace this text with a short description of your own organisation.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <StatTile key={s.label} value={s.value} label={s.label} />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {VISION_MISSION.map((v) => (
            <Card key={v.title}>
              <CardContent className="space-y-2 p-5">
                <v.icon className="size-6 text-primary" />
                <h3 className="text-base font-bold">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <SectionHeading kicker="What we value" title="Our values" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <Card key={v.title}>
                <CardContent className="space-y-2 p-5">
                  <v.icon className="size-5 text-primary" />
                  <h3 className="text-base font-bold">{v.title}</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {v.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading kicker="Leadership" title="Meet the team" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TEAM.map((m) => (
              <Card key={m.name}>
                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                  <img src={m.photo} alt={m.name} className="size-24 rounded-full object-cover" />
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading kicker="Reach" title="Our lab network" />
          <img
            src={PHOTOS.networkMap}
            alt="Lab network map placeholder"
            className="mx-auto mt-6 max-h-[420px] rounded-xl"
          />
        </div>

        <div className="text-center">
          <Button onClick={() => navigate("/contact")}>Contact us</Button>
        </div>
      </section>
    </div>
  );
}

export { AboutPage };
