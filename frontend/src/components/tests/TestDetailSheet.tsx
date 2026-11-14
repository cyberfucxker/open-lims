import { Clock, FlaskConical, IndianRupee, Layers, TestTube } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { TestParametersEditor } from "@/components/tests/TestParametersEditor";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { LabTest } from "@/types/test";

interface TestDetailSheetProps {
  test: LabTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TestDetailSheet({ test, open, onOpenChange }: TestDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-2xl">
        {test && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <FlaskConical className="size-5" />
                </div>
                <div>
                  <SheetTitle>{test.name}</SheetTitle>
                  <p className="text-xs text-muted-foreground">{test.shortName}</p>
                </div>
                <StatusBadge status={test.status} className="ml-auto" />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="size-4" /> {test.department}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TestTube className="size-4" /> {test.sampleType}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IndianRupee className="size-4" /> ₹{test.price.toLocaleString("en-IN")}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" /> {test.reportTime}
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Category
                </p>
                <p className="text-sm text-foreground">{test.category}</p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Reference Range
                </p>
                <p className="text-sm text-foreground">{test.referenceRange}</p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Description
                </p>
                <p className="text-sm text-foreground">{test.description}</p>
              </div>

              <Separator />

              <TestParametersEditor testId={test.id} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { TestDetailSheet };
