import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";

interface DatePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  disabled?: (date: Date) => boolean;
}

function toDate(value?: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  invalid,
  className,
  disabled,
}: DatePickerProps) {
  const date = toDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full justify-start gap-2 rounded-lg font-normal shadow-sm",
            !date && "text-muted-foreground/70",
            invalid && "border-destructive ring-4 ring-destructive/10",
            className,
          )}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {date
            ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? d.toISOString().slice(0, 10) : undefined)}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
