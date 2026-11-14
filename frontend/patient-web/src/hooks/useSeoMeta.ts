import { useEffect } from "react";

interface SeoMetaOptions {
  title: string;
  description?: string;
  /** Site-relative — e.g. `/jaipur/tests/complete-blood-count`. Turned into
   *  an absolute `<link rel="canonical">` off `window.location.origin`. */
  canonicalPath?: string;
  jsonLd?: Record<string, unknown>;
}

const JSON_LD_ELEMENT_ID = "page-json-ld";

function setMetaDescription(content: string) {
  let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string | null) {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement("link");
  el.setAttribute("rel", "canonical");
  el.setAttribute("href", href);
  if (!existing) document.head.appendChild(el);
}

function setJsonLd(data: Record<string, unknown> | null) {
  const existing = document.getElementById(JSON_LD_ELEMENT_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const el = (existing as HTMLScriptElement | null) ?? document.createElement("script");
  el.id = JSON_LD_ELEMENT_ID;
  el.setAttribute("type", "application/ld+json");
  el.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(el);
}

/** Hand-rolled instead of pulling in react-helmet-async (nothing like it was
 *  already a dependency here) — sets the tab title, meta description,
 *  canonical link, and an optional JSON-LD block for as long as the calling
 *  page is mounted, restoring whatever was there before on unmount so
 *  navigating away doesn't leave a stale title/description behind.
 *
 *  This only helps clients that execute JS — Google's own crawler chief among
 *  them, which is the actual target for the city+test/package SEO pages this
 *  was built for. A non-JS link-preview bot (WhatsApp, Slack, …) still won't
 *  see any of it; that needs real server-rendering, which this app doesn't
 *  have. */
export function useSeoMeta({ title, description, canonicalPath, jsonLd }: SeoMetaOptions) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const previousTitle = document.title;
    const previousDescription =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null;

    document.title = title;
    if (description) setMetaDescription(description);
    if (canonicalPath) setCanonical(`${window.location.origin}${canonicalPath}`);
    if (jsonLdKey) setJsonLd(JSON.parse(jsonLdKey) as Record<string, unknown>);

    return () => {
      document.title = previousTitle;
      if (previousDescription !== null) setMetaDescription(previousDescription);
      setCanonical(null);
      setJsonLd(null);
    };
    // `jsonLdKey` (a stable serialised snapshot) stands in for `jsonLd` itself
    // here — the caller passes a fresh object literal every render, which
    // would otherwise re-run this effect (and flicker the title) every time.
  }, [title, description, canonicalPath, jsonLdKey]);
}
