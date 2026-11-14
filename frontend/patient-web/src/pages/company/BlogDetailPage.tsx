import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, FileSearch, Share2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/common/marketing";
import { blogApi } from "@/services/api/blogApi";

function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["blog", "detail", slug],
    queryFn: () => blogApi.getBySlug(slug!),
    enabled: Boolean(slug),
    retry: false,
  });

  const post = data?.post;
  const related = data?.related ?? [];

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 pt-4" />;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <PageHeader title="Article not found" />
        <EmptyState
          icon={FileSearch}
          title="Article not found"
          description="This article may have been removed or the link is incorrect."
          actionLabel="Back to blog"
          onAction={() => navigate("/blog")}
        />
      </div>
    );
  }

  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post!.title, url }).catch(() => undefined);
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  return (
    <div className="bg-background">
      {/* Header band */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground">
        <div
          aria-hidden
          className="animate-float-slow absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to blog
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-5"
          >
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-white/25">
              {post.category}
            </span>
            <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {post.readMinutes} min read
              </span>
              <button
                type="button"
                onClick={share}
                className="flex items-center gap-1.5 hover:text-white"
              >
                <Share2 className="size-3.5" />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {post.imageUrl && (
        <div className="mx-auto -mt-8 max-w-2xl px-4">
          <img
            src={post.imageUrl}
            alt=""
            className="aspect-video w-full rounded-2xl object-cover shadow-lg"
          />
        </div>
      )}

      {/* Body */}
      <article className="mx-auto max-w-2xl px-4 py-12">
        <Reveal className="space-y-5">
          {post.body.map((para, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-foreground/90">
              {para}
            </p>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 text-center">
            <p className="text-sm font-semibold text-foreground">Not sure which test you need?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Talk to our team or book a relevant test in seconds.
            </p>
            <Button className="mt-4" onClick={() => navigate("/tests")}>
              Explore Tests & Packages
            </Button>
          </div>
        </Reveal>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="bg-accent/30 py-14">
          <div className="mx-auto max-w-4xl px-4">
            <Reveal>
              <h2 className="text-lg font-bold text-foreground">More on {post.category}</h2>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.slug} delay={i * 0.06}>
                  <Link to={`/blog/${r.slug}`}>
                    <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                      <CardContent className="space-y-2 pt-5">
                        <Badge variant="outline">{r.category}</Badge>
                        <h3 className="line-clamp-2 text-sm font-bold text-foreground">
                          {r.title}
                        </h3>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{r.excerpt}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export { BlogDetailPage };
