#!/usr/bin/env node
/**
 * Writes one static `index.html` per active city under `dist/{slug}/`,
 * `dist/tests/{slug}/` and `dist/packages/{slug}/`, plus one per fixed
 * static marketing/legal route (`dist/about/index.html`, etc.) and a
 * dedicated shell for Home — real, pre-rendered `<title>`/meta-description/
 * canonical for every one of them, so "View Page Source" (and any bot that
 * doesn't execute JS) sees that page's own content instead of the generic
 * shell every other route falls back to.
 *
 * This app has no server-rendering, so `dist/index.html` — served for every
 * unrecognised route by Nginx's SPA fallback (`try_files $uri $uri/
 * /index.html;`) — is otherwise identical no matter what URL was requested;
 * `useSeoMeta` only patches the title/description AFTER React mounts, which
 * a JS-executing crawler (Googlebot) sees but a plain HTTP fetch or "View
 * Source" never does. Nginx's `index` directive serves `{path}/index.html`
 * for an exact directory match, and `try_files`'s `$uri/` clause makes that
 * match happen even without a trailing slash — so a request for
 * `/tests/jaipur` finds `dist/tests/jaipur/index.html` before ever falling
 * back to the generic root shell. (Requires that `$uri/` clause in the
 * Nginx vhost.)
 *
 * Home is the one route this trick can't reach the same way: `/` and every
 * *un*-prerendered dynamic route (`/login`, `/orders/:id`, a test detail
 * page, …) resolve to the exact same `dist/index.html` file, so baking
 * Home's own canonical into it would wrongly claim canonical="/" on all of
 * those too. Home's real meta instead goes into a separate
 * `dist/home-shell.html`, served only for an exact `/` request by a
 * dedicated `location = /` block in the Nginx vhost — see that file's own
 * comment for why it has to be an exact match, not a prefix.
 *
 * Runs as a `postbuild` step (see package.json) — AFTER `vite build`, not
 * before, since it needs the real built `dist/index.html` (with its actual
 * hashed asset filenames) as the template to clone. The cloned copies keep
 * the exact same `<script>`/`<link>` tags, so React still mounts and
 * hydrates normally once the JS loads — a patient clicking around the site
 * never sees anything different, only a crawler reading the raw response
 * does.
 *
 * Title/description copy is hand-kept in sync with each page's own
 * client-side `useSeoMeta` call — deliberately duplicated rather than
 * imported (this is a plain Node script, not part of the Vite/React build
 * graph) so a prerendered page's copy matches what hydration replaces it
 * with, instead of visibly flashing/disagreeing.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, "dist");

function loadEnvFile(filename) {
  const filePath = path.join(ROOT, filename);
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

// Same file-precedence/env-var convention as generate-sitemap.mjs.
const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.production"), ...process.env };
const API_BASE_URL = env.VITE_API_BASE_URL ?? "https://api.example.com/api/v1/app";
const SITE_ORIGIN = env.VITE_SITE_ORIGIN ?? "https://example.com";

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// One entry per prerendered route "kind" — mirrors the three SEO landing
// routes (`/{citySlug}`, `/tests/{citySlug}`, `/packages/{citySlug}`) and the
// exact title/description copy their live page renders once JS takes over.
//
// The city landing route is the bare `/{slug}`: it is a page of its own
// (`pages/city/CityPage.tsx`), it is what the backend sitemap has always
// listed for a city, and it is what Home sends you to when you pick one.
// `/city/{slug}` still redirects here for old links, but a prerendered shell
// at that path would serve a title for a URL that immediately bounces, so
// only the real one is written.
const ROUTE_KINDS = [
  {
    urlPath: (slug) => `/${slug}`,
    title: (name) => `Book Diagnostic Tests & Health Checkups in ${name} | Example Diagnostics Lab`,
    description: (name) =>
      `Book blood tests, full body checkups and health packages in ${name} with free home sample collection and doctor-verified digital reports from Example Diagnostics Lab.`,
  },
  {
    urlPath: (slug) => `/tests/${slug}`,
    title: (name) => `Lab Tests in ${name} — Book Online | Example Diagnostics Lab`,
    description: (name) =>
      `Browse and book diagnostic tests in ${name} with free home sample collection and digital reports from Example Diagnostics Lab.`,
  },
  {
    urlPath: (slug) => `/packages/${slug}`,
    title: (name) => `Health Checkup Packages in ${name} — Book Online | Example Diagnostics Lab`,
    description: (name) =>
      `Browse and book health checkup packages in ${name} with free home sample collection and digital reports from Example Diagnostics Lab.`,
  },
];

// Fixed, single-instance routes — copy kept in sync with each page's own
// `useSeoMeta` call (see this file's own doc-comment for why duplicated).
const STATIC_ROUTES = [
  {
    urlPath: "/about",
    title: "About Us — Example Diagnostics Lab, Since 2004 | Example Diagnostics Lab",
    description:
      "Accurate, affordable lab testing and preventive health checkups — delivered with certified quality, right to your doorstep. Learn about Example Diagnostics Lab.",
  },
  {
    urlPath: "/franchise",
    title: "Partner with Example Diagnostics Lab — Franchise Opportunities",
    description:
      "Bring trusted, affordable, certified diagnostics to your city — backed by two decades of experience and a nationwide network.",
  },
  {
    urlPath: "/careers",
    title: "Careers at Example Diagnostics Lab — Build a Healthier India",
    description:
      "Join a team that's redefining diagnostics across the country — where your work has real impact and your career grows as fast as we do.",
  },
  {
    urlPath: "/contact",
    title: "Contact Us | Example Diagnostics Lab",
    description:
      "Questions about a test, an order, or a franchise? Reach Example Diagnostics Lab by call, WhatsApp, email, or visit our lab.",
  },
  {
    urlPath: "/blog",
    title: "Health Blog — Example Diagnostics Lab",
    description:
      "Notes from our pathologists and clinicians — on the tests we run, the results they reveal, and living a healthier life.",
  },
  {
    urlPath: "/privacy-policy",
    title: "Privacy Policy | Example Diagnostics Lab",
    description: "How Example Diagnostics Lab collects, uses and protects your personal information.",
  },
  {
    urlPath: "/terms",
    title: "Terms & Conditions | Example Diagnostics Lab",
    description:
      "The terms that govern your use of Example Diagnostics Lab's website, app and services.",
  },
  {
    urlPath: "/refund-policy",
    title: "Refund Policy | Example Diagnostics Lab",
    description: "Example Diagnostics Lab's policy on refunds, report comparisons and claims.",
  },
];

// Copy kept in sync with `HomePage.tsx`'s own `useSeoMeta` call.
const HOME_META = {
  title: "Book Diagnostic Tests & Full Body Checkups Online | Example Diagnostics Lab",
  description:
    "Book blood tests, full body checkups and health packages online with free home sample collection and digital reports from Example Diagnostics Lab.",
};

function renderHtml(template, { title, description, canonicalUrl }) {
  let html = template;

  html = html.includes("<title>")
    ? html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
    : html.replace("</head>", `  <title>${escapeHtml(title)}</title>\n  </head>`);

  html = /<meta\s+name="description"/.test(html)
    ? html.replace(
        /<meta\s+name="description"[^>]*>/,
        `<meta name="description" content="${escapeHtml(description)}" />`,
      )
    : html.replace(
        "</head>",
        `  <meta name="description" content="${escapeHtml(description)}" />\n  </head>`,
      );

  // No canonical tag exists in the template yet — always insert fresh.
  html = html.replace(
    "</head>",
    `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n  </head>`,
  );

  return html;
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    throw new Error(`${DIST_DIR} doesn't exist — run \`vite build\` before this script.`);
  }
  const template = readFileSync(path.join(DIST_DIR, "index.html"), "utf8");

  console.log(`Fetching city list from ${API_BASE_URL}/master/cities ...`);
  const response = await fetch(`${API_BASE_URL}/master/cities`);
  if (!response.ok) {
    throw new Error(`master/cities request failed: ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  const cities = body.data ?? [];

  let written = 0;
  for (const city of cities) {
    for (const kind of ROUTE_KINDS) {
      const urlPath = kind.urlPath(city.slug);
      const html = renderHtml(template, {
        title: kind.title(city.name),
        description: kind.description(city.name),
        canonicalUrl: `${SITE_ORIGIN}${urlPath}`,
      });
      const outDir = path.join(DIST_DIR, urlPath.replace(/^\//, ""));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(path.join(outDir, "index.html"), html);
      written++;
    }
  }

  // The per-city loop above only ever creates `dist/tests/{slug}/` and
  // `dist/packages/{slug}/` — never a bare `dist/tests/index.html` or
  // `dist/packages/index.html`, since there's no per-city copy to put there.
  // But Nginx's `try_files $uri $uri/ /index.html;` treats "directory exists"
  // as a match on its own: once any city subfolder makes `tests/` exist as a
  // real directory, a request for the bare `/tests` (no city picked yet —
  // CatalogPage's own city-agnostic view) matches `$uri/`, finds no
  // `index.html` directly inside, and Nginx 403s instead of ever falling
  // through to the root SPA shell. Writing the untouched template there
  // closes that trap — same content the root shell already gives that route.
  for (const bareDir of ["tests", "packages"]) {
    const outDir = path.join(DIST_DIR, bareDir);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, "index.html"), template);
  }

  // Fixed, single-instance marketing/legal pages — no per-city loop, one
  // real `index.html` each, matching the exact same pattern as above.
  for (const route of STATIC_ROUTES) {
    const html = renderHtml(template, {
      title: route.title,
      description: route.description,
      canonicalUrl: `${SITE_ORIGIN}${route.urlPath}`,
    });
    const outDir = path.join(DIST_DIR, route.urlPath.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, "index.html"), html);
  }

  // Home's own real meta, in a file separate from `index.html` (the shared
  // fallback template every un-prerendered route also serves) — see this
  // file's own doc-comment for why. Nginx routes an exact `/` request here.
  const homeHtml = renderHtml(template, {
    title: HOME_META.title,
    description: HOME_META.description,
    canonicalUrl: `${SITE_ORIGIN}/`,
  });
  writeFileSync(path.join(DIST_DIR, "home-shell.html"), homeHtml);

  console.log(
    `Wrote ${written} pre-rendered pages (${cities.length} cities × ${ROUTE_KINDS.length} routes), ` +
      `${STATIC_ROUTES.length} static pages, a Home shell, plus bare /tests and /packages shells.`,
  );
}

main().catch((error) => {
  console.error("prerender-city-pages failed:", error.message);
  // Same policy as generate-sitemap.mjs: a missing prerender is a worse SEO
  // page, not a broken site — never fail the build over this.
  process.exit(0);
});
