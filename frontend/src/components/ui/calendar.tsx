import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-semibold text-navy-950",
        nav: "flex items-center justify-between absolute inset-x-1 top-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 text-muted-foreground hover:text-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 text-muted-foreground hover:text-foreground",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-xs font-medium text-muted-foreground",
        week: "flex w-full mt-1",
        day: "size-9 p-0 text-center text-sm relative",
        day_button: cn(
          "size-9 rounded-lg p-0 font-normal transition-colors hover:bg-accent",
          "aria-selected:opacity-100",
        ),
        range_start: "rounded-l-lg bg-primary text-primary-foreground",
        range_end: "rounded-r-lg bg-primary text-primary-foreground",
        range_middle: "bg-primary/10",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:border [&>button]:border-primary [&>button]:text-primary",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
