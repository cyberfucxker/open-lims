import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LabTest } from "@/types/test";

interface SelectedTestsPanelProps {
  tests: LabTest[];
  selectedTestIds: string[];
  onChange: (ids: string[]) => void;
  subtotal: number;
}

function SelectedTestsPanel({
  tests,
  selectedTestIds,
  onChange,
  subtotal,
}: SelectedTestsPanelProps) {
  const selectedTests = tests.filter((t) => selectedTestIds.includes(t.id));
  const removeTest = (id: string) => onChange(selectedTestIds.filter((t) => t !== id));
  const removeAll = () => onChange([]);

  return (
    <Card className="flex h-full min-h-0 flex-col py-2.5">
      <CardHeader className="flex-row items-center gap-2 space-y-0 px-3 pb-1.5">
        <CardTitle className="flex flex-1 items-center gap-2 text-sm font-bold">
          <ClipboardCheck className="size-3.5 text-primary" />
          Selected Test List
          {selectedTests.length > 0 && <Badge variant="secondary">{selectedTests.length}</Badge>}
        </CardTitle>
        {selectedTests.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={removeAll}
            className="rounded-[6px] border border-destructive/30 px-2 py-1 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10"
          >
            &lt;&lt; Remove All
          </button>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 px-3 pt-0.5">
        <div className="max-h-64 min-h-0 flex-1 overflow-y-auto lg:max-h-full">
          {selectedTests.length === 0 ? (
            <p className="rounded-[6px] border border-dashed border-border py-6 text-center text-sm font-bold text-muted-foreground">
              No tests selected yet
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {selectedTests.map((test) => (
                  <motion.div
                    key={test.id}
                    layout
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2 overflow-hidden rounded-[6px] bg-secondary/60 px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{test.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">{test.department}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">₹{test.price}</span>
                    <button
                      type="button"
                      onClick={() => removeTest(test.id)}
                      tabIndex={-1}
                      className="rounded-[6px] p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm">
          <span className="font-bold text-muted-foreground">Subtotal</span>
          <span className="font-bold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { SelectedTestsPanel };
