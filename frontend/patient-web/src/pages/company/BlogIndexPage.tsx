import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MarketingHero, Reveal } from "@/components/common/marketing";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { blogApi } from "@/services/api/blogApi";
import { cn } from "@/utils/cn";

function BlogIndexPage() {
  useSeoMeta({
    title: "Health Blog — Example Diagnostics Lab",
    description:
      "Notes from our pathologists and clinicians — on the tests we run, the results they reveal, and living a healthier life.",
    canonicalPath: "/blog",
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Fetched once, filtered client-side below — same UX as before (instant,
  // no per-keystroke request), now backed by Superadmin-authored content
  // instead of the hardcoded array it replaces.
  const { data, isLoading } = useQuery({
    queryKey: ["blog", "list"],
    queryFn: () => blogApi.list(),
  });

  const categories = ["All", ...(data?.categories ?? [])];

  const posts = useMemo(() => {
    const allPosts = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    return allPosts.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [data, search, category]);

  return (
    <div className="bg-background">
      <MarketingHero
        eyebrow="Blog"
        title="Health, explained simply"
        subtitle="Notes from our pathologists and clinicians — on the tests we run, the results they reveal, and living a healthier life."
      />

      <section className="mx-auto max-w-7xl px-4 py-12">
        {/* Search + category filter */}
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  category === c
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Posts grid */}
        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted-foreground">
            No articles match your search.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              >
                <Link to={`/blog/${post.slug}`} className="block h-full">
                  <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1.5 hover:shadow-xl">
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/60">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="absolute inset-0 opacity-20 transition-transform duration-500 group-hover:scale-110"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                            backgroundSize: "16px 16px",
                          }}
                        />
                      )}
                      <span className="absolute bottom-3 left-4 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm">
                        {post.category}
                      </span>
                    </div>
                    <CardContent className="space-y-2.5 pt-4">
                      <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {post.readMinutes} min read
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Read <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export { BlogIndexPage };
