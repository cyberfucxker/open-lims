import { useMemo, useState } from "react";
import { ChevronsUpDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";

interface MultiSelectOption {
  value: string;
  label: string;
  meta?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  /** Suppresses the chip row below the trigger. Set by callers that render their
   *  own richer list of the selection — `OrderedParameterPicker` does, because
   *  its list is reorderable and unordered chips beside it would be misleading. */
  hideChips?: boolean;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  emptyText = "No options found.",
  hideChips = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.meta?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between font-normal"
          >
            <span
              className={cn(
                "truncate text-left",
                selectedOptions.length === 0 && "text-muted-foreground/70",
              )}
            >
              {selectedOptions.length > 0 ? `${selectedOptions.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="scrollbar-thin max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
                    )}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.meta && (
                      <span className="shrink-0 text-xs text-muted-foreground">{option.meta}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {!hideChips && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 py-1 pr-1.5 pl-2.5 text-xs font-medium"
            >
              {option.label}
              <button
                type="button"
                onClick={() => toggle(option.value)}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { MultiSelect };
export type { MultiSelectOption };
