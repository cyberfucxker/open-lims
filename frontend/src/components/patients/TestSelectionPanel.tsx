import { FlaskConical, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { LabTest } from "@/types/test";
import { cn } from "@/utils/cn";

interface TestSelectionPanelProps {
  tests: LabTest[];
  isLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  selectedTestIds: string[];
  onChange: (ids: string[]) => void;
}

function TestSelectionPanel({
  tests,
  isLoading,
  search,
  onSearchChange,
  selectedTestIds,
  onChange,
}: TestSelectionPanelProps) {
  const addTest = (id: string) => {
    if (!selectedTestIds.includes(id)) onChange([...selectedTestIds, id]);
    onSearchChange("");
  };
  const removeTest = (id: string) => onChange(selectedTestIds.filter((t) => t !== id));
  const addAll = () => onChange([...new Set([...selectedTestIds, ...tests.map((t) => t.id)])]);

  return (
    <Card className="flex h-full min-h-0 flex-col py-2.5">
      <CardHeader className="flex-row items-center gap-2 space-y-0 px-3 pb-1.5">
        <CardTitle className="flex flex-1 items-center gap-2 text-sm font-bold">
          <FlaskConical className="size-3.5 text-primary" />
          Test List
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            Alt+A
          </kbd>
        </CardTitle>
        <button
          type="button"
          tabIndex={-1}
          onClick={addAll}
          className="rounded-[6px] border border-primary/40 px-2 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
        >
          Add All &gt;&gt;
        </button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-0.5">
        {/* The catalog runs to ~4000 tests, so the API is never asked to
            hand over the whole thing — only a couple of tests show before
            a search, and every keystroke re-queries `/tests?search=…`
            (debounced) for matches instead of filtering a client-side list.
            `shouldFilter={false}` hands cmdk a list that's already the
            server's answer, so it renders as-is rather than re-filtering
            client-side against each item's `value` (which would incorrectly
            hide results the server matched on a field, e.g. department,
            that isn't part of that string). */}
        <Command shouldFilter={false} className="min-h-0 flex-1 rounded-[6px] border border-border">
          {/* cmdk's CommandInput always overwrites a passed `id` with its own generated one,
              so a stable wrapper id is used to target the real input from outside instead. */}
          <div id="test-search-wrapper">
            <CommandInput
              value={search}
              onValueChange={onSearchChange}
              placeholder="Search tests…"
              className="h-9 text-sm font-bold placeholder:text-xs placeholder:font-normal"
            />
          </div>
          <CommandList className="max-h-64 flex-1 lg:max-h-full">
            <CommandEmpty>
              {isLoading
                ? "Loading tests…"
                : search
                  ? "No tests found."
                  : "Type to search the full catalog…"}
            </CommandEmpty>
            <CommandGroup>
              {tests.map((test) => {
                const isSelected = selectedTestIds.includes(test.id);
                return (
                  <CommandItem
                    key={test.id}
                    value={`${test.name} ${test.shortName}`}
                    onSelect={() => (isSelected ? removeTest(test.id) : addTest(test.id))}
                    className="py-1.5 text-sm font-bold"
                  >
                    <Plus
                      className={cn(
                        "size-3.5",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex-1 truncate">{test.name}</span>
                    <span className="text-sm font-bold text-muted-foreground">₹{test.price}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
}

export { TestSelectionPanel };
