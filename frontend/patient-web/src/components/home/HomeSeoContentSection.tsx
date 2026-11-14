import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface HomeSeoContentSectionProps {
  heading: string | null;
  body: string | null;
  isLoading: boolean;
}

/** Rich-text SEO intro block, collapsed to a fixed height with a "Read
 *  More"/"Read Less" toggle — same purpose as Redcliffe's "Quality
 *  Diagnostic Matters!" block. `body` is trusted HTML authored by an admin
 *  in Superadmin CMS (Home FAQs tab), not user-generated. */
function HomeSeoContentSection({ heading, body, isLoading }: HomeSeoContentSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isLoading && !body) return null;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-2/3 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
        ) : (
          <>
            {heading && (
              <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">{heading}</h2>
            )}
            <div
              className={cn(
                "text-sm leading-relaxed text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0",
                !expanded && "line-clamp-3",
              )}
              // Trusted admin-authored HTML (Superadmin CMS), not user-generated — see comment above.
              dangerouslySetInnerHTML={{ __html: body ?? "" }}
            />
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {expanded ? "Read Less" : "Read More"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export { HomeSeoContentSection };
