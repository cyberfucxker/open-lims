import { FileSpreadsheet, FileText, Table2 } from "lucide-react";

import { cn } from "@/utils/cn";

interface FormatIconProps {
  format: "xlsx" | "csv" | "pdf";
  className?: string;
}

const FORMAT_CONFIG = {
  xlsx: { icon: FileSpreadsheet, className: "bg-success/10 text-success" },
  csv: { icon: Table2, className: "bg-info/10 text-info" },
  pdf: { icon: FileText, className: "bg-destructive/10 text-destructive" },
} as const;

function FormatIcon({ format, className }: FormatIconProps) {
  const config = FORMAT_CONFIG[format];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        config.className,
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export { FormatIcon };
