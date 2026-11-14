import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { AppleGlyph, GooglePlayColorGlyph } from "@/components/brand/StoreGlyphs";
import { APP_STORE_URL, PLAY_STORE_URL, buildQrImageUrl, getAppUrl } from "@/config/appLinks";
import { useIsDesktop } from "@/hooks/useMediaQuery";

/** Dismissal lives in `sessionStorage`, not `localStorage`, on purpose: the
 *  card should stay gone for the rest of this browsing session but come back
 *  on the patient's next visit, which is what "remind me later" means for a
 *  marketing prompt. */
const DISMISS_KEY = "openlims:app-download-widget-dismissed";

/** Long enough that it never competes with the hero/first paint, short enough
 *  that someone skimming the home page still sees it. */
const APPEAR_DELAY_MS = 1600;

/** All the copy in one place. The headline is split so the offer half can
 *  carry the brand red on its own line — set `titleAccent` to `null` to run
 *  the card as a plain "Download Our App" promo with no offer attached. */
const COPY = {
  title: "Scan. Download.",
  /** Rendered in brand red on its own line under the title. */
  titleAccent: "Get ₹150 OFF!" as string | null,
  subtitle: "Valid on first booking",
  /** Prefixed onto `subtitle`'s line, not a separate line — reads "*T&C
   *  Apply Valid on first booking" so the caveat is seen before the claim,
   *  not easy to miss off to the side. */
  note: "*T&C Apply",
};

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

function readDismissed(): boolean {
  // Private-mode browsers throw on `sessionStorage` access rather than
  // returning null, so every read/write here is guarded.
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Floating bottom-right "Download Our App" ticket card.
 *
 *  The QR encodes our own `/get-app` route rather than a store URL, so a
 *  single code works for both platforms — `/get-app` reads the scanning
 *  phone's User-Agent and forwards it to the App Store or Play Store. The two
 *  store glyphs under the code are the same-device fallback for visitors who
 *  are already on a phone and can just tap through instead of scanning.
 *
 *  Desktop-only (`md` and up): a QR needs a second device to scan it, and on a
 *  phone this card would land on top of the bottom tab bar and the floating
 *  cart CTA. Phone visitors still get direct store buttons in the footer. */
function AppDownloadWidget() {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDesktop || readDismissed()) return;
    const timer = window.setTimeout(() => setOpen(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isDesktop]);

  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage blocked — the card just returns on the next page load */
    }
  };

  const qrTarget = getAppUrl();

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-label="Download the Example Lab app"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="fixed right-4 bottom-4 z-40 w-[12.5rem]"
        >
          {/* `overflow-visible` is load-bearing: the two notch circles below
              hang half outside this box to cut the ticket silhouette. */}
          <div className="relative rounded-3xl bg-card shadow-2xl ring-1 ring-black/5">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>

            <div className="px-3 pt-4 pb-2.5 text-center">
              <h2 className="text-sm leading-snug font-extrabold tracking-tight text-slate-950">
                {COPY.title}
              </h2>
              {COPY.titleAccent && (
                <p className="text-sm leading-snug font-extrabold tracking-tight text-primary">
                  {COPY.titleAccent}
                </p>
              )}
              <p className="mt-1 text-[0.65rem] font-bold text-foreground">
                <span className="font-medium text-muted-foreground">{COPY.note} </span>
                {COPY.subtitle}
              </p>
            </div>

            {/* Ticket perforation — two background-coloured circles biting into
                the card edges, joined by the dashed rule. */}
            <div className="relative">
              <span
                aria-hidden
                className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-background"
              />
              <span
                aria-hidden
                className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-background"
              />
              <div className="mx-3 border-t-2 border-dashed border-border" />
            </div>

            <div className="px-3 pt-2.5 pb-3">
              <div className="flex items-start justify-center">
                <a
                  href={qrTarget}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <img
                    src={buildQrImageUrl(qrTarget, 300)}
                    alt="QR code — scan with your phone to install the Example Lab app"
                    width={88}
                    height={88}
                    loading="lazy"
                    className="size-[5.5rem] object-contain"
                  />
                </a>
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-4">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download on the App Store"
                  className="text-slate-800 transition-transform hover:scale-110"
                >
                  <AppleGlyph className="size-5" />
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get it on Google Play"
                  className="transition-transform hover:scale-110"
                >
                  <GooglePlayColorGlyph className="size-5" />
                </a>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export { AppDownloadWidget };
