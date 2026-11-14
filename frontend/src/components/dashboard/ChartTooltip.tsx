interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { name: string; value: number; color: string }[];
  formatValue?: (value: number) => string;
}

function ChartTooltip({
  active,
  label,
  payload,
  formatValue = (v) => v.toLocaleString("en-IN"),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-sm shadow-2xl">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold text-foreground">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ChartTooltip };
