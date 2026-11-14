import { motion } from "framer-motion";
import {
  Activity,
  Check,
  Heart,
  Droplet,
  FlaskConical,
  Bone,
  Sparkles,
  ShieldAlert,
  Sun,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";
import type { CategoryItem } from "@/types";

/** Mock categories have no icon field — map by id so each chip still reads as
 *  distinct at a glance instead of falling back to a single generic glyph. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cat_fullbody: Activity,
  cat_diabetes: Droplet,
  cat_heart: Heart,
  cat_hormone: Sparkles,
  cat_vitamin: Sun,
  cat_liver: FlaskConical,
  cat_kidney: Bone,
  cat_blood: ShieldAlert,
  cat_infection: Stethoscope,
};

interface CategoryChipProps {
  category: CategoryItem;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  /** "lg" is the home page's category showcase — a bigger card with a full
   *  image. "row" is the full-width list row in the catalogue filter panel:
   *  icon, then the category's whole name.
   *
   *  Both call sites name one, so there is no default. There used to be a
   *  third, "sm" — a fixed-width tile whose label clipped at `max-w-20` — and
   *  it went when the filter panel became a list, since a wrapped grid of
   *  tiles was the only thing that ever wanted a label short enough to fit
   *  one. */
  size: "lg" | "row";
}

function CategoryChip({ category, selected = false, onClick, className, size }: CategoryChipProps) {
  const Icon = CATEGORY_ICONS[category.id] ?? Activity;
  const imageSrc = category.thumbnail ?? category.image;

  if (size === "lg") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        whileHover={{ y: -3 }}
        className={cn(
          "group flex w-full flex-col items-center gap-1 rounded-xl border border-border bg-card px-1 py-2 text-center shadow-sm transition-shadow hover:shadow-lg sm:py-2.5",
          className,
        )}
      >
        <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted sm:size-10">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            />
          ) : (
            <Icon className="size-4 text-muted-foreground transition-transform duration-300 ease-out group-hover:scale-110 sm:size-4.5" />
          )}
        </span>
        <span className="w-full truncate text-[10px] font-medium text-foreground sm:text-[11px]">
          {category.name}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/[0.07] text-primary"
          : "border-border bg-card text-foreground hover:bg-accent",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          imageSrc
            ? "bg-muted"
            : selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="" className="size-6 object-contain" loading="lazy" />
        ) : (
          <Icon className="size-5" />
        )}
      </span>

      {/* No truncation and no max-width: a full-width row is the whole
          reason this variant exists. The old `sm` chip clipped at `max-w-20`,
          which turned the filter panel into "Full Body C…", "Fever &
          Infe…", "Senior Citiz…". */}
      <span className="min-w-0 flex-1 text-sm font-medium">{category.name}</span>

      {selected && <Check className="size-4 shrink-0" strokeWidth={2.5} />}
    </motion.button>
  );
}

export { CategoryChip };
