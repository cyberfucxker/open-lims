import type { PublicCmsPageDto } from "../types/cmsPage.types";

/** Renders CMS pages as self-contained HTML (inline CSS, no external
 *  requests) so a mobile WebView can load them directly — the JSON API at
 *  `/api/v1/cms/:appType/:slug` remains for clients that want raw data. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PAGE_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 20px 20px 48px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    line-height: 1.65;
    background: #ffffff;
    max-width: 720px;
    margin-inline: auto;
  }
  h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 16px; color: #111827; }
  h2 { font-size: 1.2rem; font-weight: 600; margin: 28px 0 10px; color: #111827; }
  h3 { font-size: 1.05rem; font-weight: 600; margin: 20px 0 8px; color: #111827; }
  p { margin: 0 0 14px; color: #374151; }
  strong { color: #111827; font-weight: 600; }
  ul, ol { margin: 0 0 14px; padding-left: 22px; color: #374151; }
  li { margin-bottom: 4px; }
  a { color: #2563eb; text-decoration: underline; }
  img { max-width: 100%; height: auto; border-radius: 10px; margin: 12px 0; display: block; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 0.92rem; }
  th { background: #f9fafb; font-weight: 600; }
  blockquote { border-left: 3px solid #e5e7eb; margin: 12px 0; padding-left: 14px; color: #6b7280; font-style: italic; }
  .cms-updated { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #9ca3af; }
`;

export function renderCmsPageHtml(page: PublicCmsPageDto): string {
  const title = escapeHtml(page.metaTitle || page.title);
  const description = escapeHtml(page.metaDescription || "");
  const updated = new Date(page.updatedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>${title}</title>
${description ? `<meta name="description" content="${description}" />` : ""}
<style>${PAGE_STYLES}</style>
</head>
<body>
${page.content}
<div class="cms-updated">Last updated: ${updated}</div>
</body>
</html>`;
}

export function renderCmsPageNotFoundHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Page not found</title>
<style>${PAGE_STYLES}
  body { text-align: center; padding-top: 80px; }
</style>
</head>
<body>
<h1>Page not found</h1>
<p>This page isn't available right now. Please check back later.</p>
</body>
</html>`;
}
