import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/utils/cn";

/** Typography for admin-authored rich text (Superadmin's Tiptap editor:
 *  headings, lists, tables, links). No typography plugin is installed, so
 *  these are hand-rolled arbitrary-variant selectors — the same set
 *  Superadmin's `RICH_TEXT_CONTENT_CLASSES` uses, so the page matches what
 *  the admin saw while editing. */
const RICH_TEXT_CLASSES = cn(
  "text-sm leading-relaxed text-muted-foreground",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-foreground [&_h1:first-child]:mt-0",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_h2:first-child]:mt-0",
  "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
  "[&_li_p]:mb-0",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs sm:[&_table]:text-sm",
  "[&_th]:border [&_th]:border-border [&_th]:bg-secondary/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
  "[&_td_p]:mb-0 [&_th_p]:mb-0",
);

/** The opening heading plus four lines of `text-sm leading-relaxed` body
 *  text (4 × 0.875rem × 1.625 ≈ 5.7rem, heading + its margin ≈ 2rem). */
const COLLAPSED_MAX_HEIGHT = "7.75rem";

interface ExpandableRichContentProps {
  /** Trusted HTML authored by an admin in Superadmin — not user-generated. */
  html: string;
  title?: string;
}

/** A rich-text block folded to its first four lines, with a "Read more"
 *  toggle shown only when there's actually more to read. Collapsing uses a
 *  max-height (not `line-clamp`) because the body mixes headings, lists and
 *  tables, which `-webkit-line-clamp` can't truncate cleanly. */
function ExpandableRichContent({ html, title }: ExpandableRichContentProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html]);

  const collapsed = !expanded;

  return (
    <div>
      {title && <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>}
      <div className="relative">
        <div
          ref={bodyRef}
          className={cn(RICH_TEXT_CLASSES, "overflow-hidden")}
          style={collapsed ? { maxHeight: COLLAPSED_MAX_HEIGHT } : undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {collapsed && overflows && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
          />
        )}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

export { ExpandableRichContent };
