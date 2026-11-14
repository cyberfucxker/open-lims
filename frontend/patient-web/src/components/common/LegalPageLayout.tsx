import { Fragment } from "react";
import { Phone } from "lucide-react";

import { MarketingHero, Reveal } from "@/components/common/marketing";
import { cn } from "@/utils/cn";

/** A legal document is just paragraphs and (numbered or bulleted) lists, in
 *  order — this is the smallest shape that can express every clause in the
 *  source policies without losing structure. */
export type LegalBlock =
  { type: "p"; text: string } | { type: "list"; items: string[]; ordered?: boolean };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

/** Terser authoring helpers for the content files — `p("...")` and
 *  `list([...])` read a lot closer to the source document than object
 *  literals would. */
export function p(text: string): LegalBlock {
  return { type: "p", text };
}
export function list(items: string[], ordered = false): LegalBlock {
  return { type: "list", items, ordered };
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (block.type === "p") {
    return <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>;
  }

  const items = block.items.map((item, i) => (
    <li
      key={i}
      className={cn(
        "text-sm leading-relaxed text-muted-foreground",
        !block.ordered && "flex gap-2",
      )}
    >
      {!block.ordered && <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />}
      <span>{item}</span>
    </li>
  ));

  return block.ordered ? (
    <ol className="list-decimal space-y-2 pl-5">{items}</ol>
  ) : (
    <ul className="space-y-2">{items}</ul>
  );
}

/** Shared shell for Privacy Policy / Terms & Conditions / Refund Policy —
 *  a hero, a sticky on-page table of contents, and the sections themselves
 *  as one continuous card so long documents still read as a single page. */
function LegalPageLayout({
  eyebrow,
  title,
  subtitle,
  effectiveDate,
  sections,
  showTableOfContents = true,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  effectiveDate?: string;
  sections: LegalSection[];
  /** Off for a policy short enough that jumping to a section isn't worth a
   *  sidebar for — e.g. Refund Policy. Drops the two-column layout for a
   *  single centred column instead of leaving an empty 240px gutter. */
  showTableOfContents?: boolean;
}) {
  return (
    <div className="bg-background">
      <MarketingHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:pb-20">
        <div
          className={cn(
            "grid grid-cols-1 gap-8",
            showTableOfContents && "lg:grid-cols-[240px_1fr]",
          )}
        >
          {/* On-page nav — desktop only, sticky alongside the content */}
          {showTableOfContents && (
            <aside className="hidden lg:block">
              {/* `flex flex-col` + `max-h-[...]` caps the whole card to the
                  viewport (minus the `top-24` offset) so it never runs off
                  the bottom of the screen on a long policy with many
                  sections — the "On this page" label is `shrink-0` so it
                  stays put while `min-h-0 overflow-y-auto` lets just the
                  link list underneath it scroll internally once it doesn't
                  fit. The page itself still scrolls normally; this is the
                  one exception. */}
              <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col rounded-2xl border border-border bg-card p-4">
                <p className="shrink-0 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  On this page
                </p>
                <nav className="mt-3 min-h-0 space-y-1 overflow-y-auto">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {s.heading}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          <div className={cn("min-w-0", !showTableOfContents && "mx-auto w-full max-w-3xl")}>
            {effectiveDate && (
              <p className="mb-6 text-xs font-medium text-muted-foreground">
                Last updated: {effectiveDate}
              </p>
            )}

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
              <div className="divide-y divide-border">
                {sections.map((s, i) => (
                  <Fragment key={s.id}>
                    <Reveal delay={Math.min(i * 0.02, 0.2)}>
                      <div
                        id={s.id}
                        className={cn("scroll-mt-24 space-y-3", i === 0 ? "pb-8" : "py-8")}
                      >
                        <h2 className="text-base font-bold text-foreground sm:text-lg">
                          {s.heading}
                        </h2>
                        {s.blocks.map((block, bi) => (
                          <LegalBlockView key={bi} block={block} />
                        ))}
                      </div>
                    </Reveal>
                  </Fragment>
                ))}
              </div>
            </div>

            <Reveal
              delay={0.1}
              className="mt-6 rounded-2xl border border-border bg-accent/30 p-5 text-sm text-muted-foreground"
            >
              Questions about this policy? Reach our Grievance Officer at{" "}
              <a href="mailto:info@example.com" className="font-semibold text-primary">
                info@example.com
              </a>{" "}
              or{" "}
              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-1 font-semibold text-primary"
              >
                <Phone className="size-3.5" />
                +91 98765 43210
              </a>
              .
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}

export { LegalPageLayout };
