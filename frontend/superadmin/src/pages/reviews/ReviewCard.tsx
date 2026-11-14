import { motion } from "framer-motion";
import { CheckCircle2, Smartphone, Syringe } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, initials } from "@/lib/format";
import type { UserAppReview } from "@/lib/types";
import { cn } from "@/utils/cn";

import { RatingStars } from "./RatingStars";

interface ReviewCardProps {
  review: UserAppReview;
  index: number;
  onResolve: (id: string) => void;
}

function ReviewCard({ review, index, onResolve }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-colors",
        review.flagged ? "border-destructive/30 bg-destructive/[0.03]" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials(review.customerName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-foreground">{review.customerName}</span>
            <RatingStars rating={review.rating} />
          </div>
        </div>
        <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{review.comment}</p>

      <div className="flex flex-wrap items-center gap-2">
        {review.targetType === "app" ? (
          <Badge variant="info">
            <Smartphone /> App Review
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Syringe /> Phlebo: {review.targetName}
          </Badge>
        )}
        {review.flagged && <Badge variant="destructive">Flagged for Follow-up</Badge>}
      </div>

      {review.flagged && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onResolve(review.id)}
        >
          <CheckCircle2 className="size-3.5" /> Mark Resolved
        </Button>
      )}
    </motion.div>
  );
}

export { ReviewCard };
