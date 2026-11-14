import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Download, FileText, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportListItem } from "@/types";

interface ReportRowProps {
  report: ReportListItem;
  index?: number;
  onDownload: (id: string) => void;
  isDownloading?: boolean;
}

function ReportRow({ report, index = 0, onDownload, isDownloading = false }: ReportRowProps) {
  const isReady = report.orderStatus === "ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold">{report.testName}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(report.bookingDate), "d MMM yyyy")} · {report.reportId}
            </p>
            {isReady ? (
              <Badge variant="success">Ready</Badge>
            ) : (
              <Badge variant="warning">Report is being processed</Badge>
            )}
          </div>
          {isReady && (
            <Button size="sm" onClick={() => onDownload(report.id)} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { ReportRow };
