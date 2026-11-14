import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CsvImportResult } from "@/services/api/csvImport.types";

interface ImportResultDialogProps {
  result: CsvImportResult | null;
  onClose: () => void;
}

/** Shows the outcome of a catalogue CSV import (Tests/Packages/Parameters) —
 *  shared across all three tabs since the backend returns the same
 *  `CsvImportResult` shape for each. Rows that failed validation are listed
 *  individually (row number + reason) since import is "skip bad rows,
 *  import the rest", not all-or-nothing. */
function ImportResultDialog({ result, onClose }: ImportResultDialogProps) {
  return (
    <Dialog open={!!result} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import complete</DialogTitle>
          <DialogDescription>
            {result?.totalRows} row{result?.totalRows === 1 ? "" : "s"} processed from the file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="tabular-nums">
            {result?.insertedCount ?? 0} created
          </Badge>
          <Badge variant="secondary" className="tabular-nums">
            {result?.updatedCount ?? 0} updated
          </Badge>
          {!!result?.errors.length && (
            <Badge variant="destructive" className="tabular-nums">
              {result.errors.length} skipped
            </Badge>
          )}
          {!!result?.warnings?.length && (
            <Badge variant="outline" className="tabular-nums text-warning">
              {result.warnings.length} imported with warnings
            </Badge>
          )}
        </div>

        {!!result?.errors.length && (
          <ScrollArea className="h-64 rounded-lg border border-border">
            <div className="flex flex-col divide-y divide-border">
              {result.errors.map((err) => (
                <div key={err.row} className="flex gap-2 px-3 py-2 text-sm">
                  <span className="shrink-0 font-medium text-muted-foreground">Row {err.row}</span>
                  <span className="text-foreground">{err.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!!result?.warnings?.length && (
          <ScrollArea className="h-48 rounded-lg border border-warning/30 bg-warning/5">
            <div className="flex flex-col divide-y divide-warning/20">
              {result.warnings.map((warn) => (
                <div key={warn.row} className="flex gap-2 px-3 py-2 text-sm">
                  <span className="shrink-0 font-medium text-muted-foreground">Row {warn.row}</span>
                  <span className="text-foreground">{warn.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ImportResultDialog };
