import { Ban, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface BookableBadgeProps {
  bookable: boolean;
  /** `compact` drops the wording to just the icon + one word, for table cells. */
  compact?: boolean;
}

/** Renders a parameter's `bookable` flag (its `doTest` value) the same way
 *  everywhere it appears — the detail previews and the Parameters list.
 *
 *  The wording deliberately describes the patient-app CONSEQUENCE rather than
 *  restating the field name: an admin reading a package preview needs to know
 *  "will a customer be able to add this on its own?", not "is doTest true". */
function BookableBadge({ bookable, compact = false }: BookableBadgeProps) {
  if (bookable) {
    return (
      <Badge variant="secondary" className="w-fit gap-1 whitespace-nowrap text-success">
        <PlusCircle className="size-3" />
        {compact ? "Bookable" : "Bookable on its own"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="w-fit gap-1 whitespace-nowrap text-muted-foreground">
      <Ban className="size-3" />
      {compact ? "Nested" : "Part of a test only"}
    </Badge>
  );
}

export { BookableBadge };
