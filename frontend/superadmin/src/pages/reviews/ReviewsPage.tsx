import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  MessageSquareText,
  RotateCcw,
  Smartphone,
  Star,
  Syringe,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";
import { reviews as mockReviews } from "@/lib/mock";
import type { UserAppReview } from "@/lib/types";

import { RatingDistributionBar } from "./RatingDistributionBar";
import { ReviewCard } from "./ReviewCard";

type TargetFilter = "all" | UserAppReview["targetType"];
type RatingBucket = "all" | "4-5" | "3" | "1-2";

function matchesRatingBucket(rating: number, bucket: RatingBucket): boolean {
  if (bucket === "all") return true;
  if (bucket === "4-5") return rating >= 4;
  if (bucket === "3") return rating === 3;
  return rating <= 2;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

function ReviewsPage() {
  const [reviews, setReviews] = useState<UserAppReview[]>(mockReviews);

  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [ratingBucket, setRatingBucket] = useState<RatingBucket>("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews
      .filter((r) => {
        const matchesSearch =
          !q ||
          r.customerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          (r.targetName?.toLowerCase().includes(q) ?? false);
        const matchesTarget = targetFilter === "all" || r.targetType === targetFilter;
        const matchesRating = matchesRatingBucket(r.rating, ratingBucket);
        const matchesFlagged = !flaggedOnly || r.flagged;
        return matchesSearch && matchesTarget && matchesRating && matchesFlagged;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, search, targetFilter, ratingBucket, flaggedOnly]);

  const stats = useMemo(() => {
    const appRatings = reviews.filter((r) => r.targetType === "app").map((r) => r.rating);
    const phleboRatings = reviews.filter((r) => r.targetType === "phlebo").map((r) => r.rating);
    const flaggedCount = reviews.filter((r) => r.flagged).length;
    return {
      avgAppRating: average(appRatings),
      avgPhleboRating: average(phleboRatings),
      flaggedCount,
      total: reviews.length,
    };
  }, [reviews]);

  function resetFilters() {
    setSearch("");
    setTargetFilter("all");
    setRatingBucket("all");
    setFlaggedOnly(false);
  }

  function handleResolve(id: string) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, flagged: false } : r)));
    toast.success("Review marked as resolved.");
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reviews & Ratings"
        description="Track customer sentiment across the app experience and phlebotomist visits."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Average App Rating"
          value={stats.avgAppRating ? `${stats.avgAppRating} / 5` : "—"}
          icon={Smartphone}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Average Phlebo Rating"
          value={stats.avgPhleboRating ? `${stats.avgPhleboRating} / 5` : "—"}
          icon={Syringe}
          gradient="bg-emerald-500"
          index={1}
        />
        <StatCard
          title="Flagged Reviews"
          value={formatNumber(stats.flaggedCount)}
          icon={AlertTriangle}
          gradient="bg-orange-500"
          index={2}
          alert={stats.flaggedCount > 0}
        />
        <StatCard
          title="Total Reviews"
          value={formatNumber(stats.total)}
          icon={Star}
          gradient="bg-violet-500"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer, phlebo name, or comment..."
                  className="min-w-[220px] flex-1"
                />
                <Select
                  value={targetFilter}
                  onValueChange={(v) => setTargetFilter(v as TargetFilter)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Targets</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="phlebo">Phlebo</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={ratingBucket}
                  onValueChange={(v) => setRatingBucket(v as RatingBucket)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4-5">4-5 stars</SelectItem>
                    <SelectItem value="3">3 stars</SelectItem>
                    <SelectItem value="1-2">1-2 stars</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <Switch
                    id="flagged-only"
                    checked={flaggedOnly}
                    onCheckedChange={setFlaggedOnly}
                  />
                  <Label
                    htmlFor="flagged-only"
                    className="text-xs whitespace-nowrap text-muted-foreground"
                  >
                    Flagged only
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
                  <RotateCcw className="size-3.5" /> Reset
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Showing {formatNumber(filtered.length)} of {formatNumber(reviews.length)} reviews
              </span>
            </CardContent>
          </Card>
        </div>
        <RatingDistributionBar reviews={reviews} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews found"
          description="Try adjusting your search or filters to see customer reviews."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  );
}

export { ReviewsPage };
