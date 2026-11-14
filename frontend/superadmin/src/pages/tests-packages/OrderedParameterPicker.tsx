import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/utils/cn";

import { BookableBadge } from "./BookableBadge";
import { MultiSelect } from "./MultiSelect";

export interface PickerParameter {
  id: string;
  name: string;
  shortName: string;
  price: number;
  /** The analyte's `doTest` flag — surfaced so an admin can see at a glance
   *  which of a test's analytes a patient could also buy on its own. */
  bookable: boolean;
}

interface OrderedParameterPickerProps {
  /** Every selectable analyte (unfiltered — a Test may nest a non-bookable one). */
  options: PickerParameter[];
  /** Selected parameter ids, IN ORDER. Position is what becomes `sortOrder`. */
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

/** Attach-and-order control for a Test's analytes.
 *
 *  Order is meaningful — it's the `sortOrder` the printed report follows — so
 *  this deliberately isn't a plain multi-select: adding appends, and the chosen
 *  rows are then reorderable. Drag handles cover the mouse case; the up/down
 *  buttons exist because native HTML5 drag-and-drop is unusable by keyboard and
 *  this control must not become the one part of the form a keyboard user can't
 *  operate. */
function OrderedParameterPicker({
  options,
  selected,
  onChange,
  disabled = false,
}: OrderedParameterPickerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  // Selection order is the source of truth, so map over `selected` rather than
  // filtering `options` (which would silently re-sort to the option list's order).
  const chosen = useMemo(
    () => selected.map((id) => byId.get(id)).filter((p): p is PickerParameter => Boolean(p)),
    [selected, byId],
  );

  const multiSelectOptions = useMemo(
    () =>
      options.map((o) => ({
        value: o.id,
        label: `${o.name} (${o.shortName})`,
        meta: o.bookable ? `${formatCurrency(o.price)} · bookable` : formatCurrency(o.price),
      })),
    [options],
  );

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  }

  function moveTo(from: number, to: number) {
    if (from === to) return;
    const next = [...selected];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(id: string) {
    onChange(selected.filter((value) => value !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <MultiSelect
        options={multiSelectOptions}
        selected={selected}
        onChange={onChange}
        placeholder="Search and select parameters"
        emptyText="No parameters found."
        hideChips
      />

      {chosen.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No parameters attached. That's valid — this test will report as a single free-text result
          line.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {chosen.map((parameter, index) => (
            <li
              key={parameter.id}
              draggable={!disabled}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(index);
              }}
              onDragLeave={() =>
                setDragOverIndex((current) => (current === index ? null : current))
              }
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) moveTo(dragIndex, index);
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 transition-colors",
                dragOverIndex === index && dragIndex !== index && "border-primary bg-primary/5",
                dragIndex === index && "opacity-50",
              )}
            >
              <GripVertical
                className={cn(
                  "size-4 shrink-0 text-muted-foreground",
                  !disabled && "cursor-grab active:cursor-grabbing",
                )}
                aria-hidden
              />
              <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {parameter.name}
                </span>
                <span className="text-xs text-muted-foreground">{parameter.shortName}</span>
              </div>
              <BookableBadge bookable={parameter.bookable} compact />
              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={disabled || index === 0}
                  aria-label={`Move ${parameter.name} up`}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={disabled || index === chosen.length - 1}
                  aria-label={`Move ${parameter.name} down`}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  disabled={disabled}
                  aria-label={`Remove ${parameter.name}`}
                  onClick={() => remove(parameter.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export { OrderedParameterPicker };
