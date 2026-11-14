import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function SlaBadge({ breached }: { breached: boolean }) {
  return breached ? (
    <Badge variant="destructive">
      <AlertTriangle /> Breached
    </Badge>
  ) : (
    <Badge variant="success">
      <CheckCircle2 /> On Track
    </Badge>
  );
}

export { SlaBadge };
