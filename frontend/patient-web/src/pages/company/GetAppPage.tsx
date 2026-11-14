import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { AppleGlyph, GooglePlayColorGlyph } from "@/components/brand/StoreGlyphs";
import { APP_STORE_URL, PLAY_STORE_URL, detectPlatform, resolveStoreUrl } from "@/config/appLinks";

/** The single hop every Example Lab app QR code points at.
 *
 *  A QR code carries one fixed URL, so encoding a store link directly would
 *  need two separate codes — one per platform. This route is that one URL: it
 *  reads the scanning device's User-Agent and forwards Android to Play Store,
 *  iPhone/iPad to App Store, and everything else (desktop, unknown crawlers)
 *  to the Play Store listing, which is the one that reads sensibly in a
 *  desktop browser.
 *
 *  It renders outside `AppShell` — no nav, no footer — because the intended
 *  lifetime of this page is a few hundred milliseconds. The markup below is
 *  the fallback for the cases where it isn't: a blocked redirect, a browser
 *  with scripting restrictions, or someone who hit Back from the store. */
function GetAppPage() {
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    const target = resolveStoreUrl(detectPlatform());
    setRedirected(true);
    // `replace`, not `assign`: pressing Back from the store should return to
    // whatever the visitor was on before, not bounce them through this hop
    // again in an infinite loop.
    window.location.replace(target);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Logo className="h-10" />
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-foreground">Opening the Example Lab app store page…</h1>
        <p className="text-sm text-muted-foreground">
          {redirected ? "Not redirected automatically? Pick your store below." : "Just a moment."}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={PLAY_STORE_URL}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <GooglePlayColorGlyph className="size-5" />
          Google Play
        </a>
        <a
          href={APP_STORE_URL}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <AppleGlyph className="size-5" />
          App Store
        </a>
      </div>
    </main>
  );
}

export { GetAppPage };
