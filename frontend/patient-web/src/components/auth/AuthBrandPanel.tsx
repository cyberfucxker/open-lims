import brandLogo from "@/assets/logo.png";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import type { AuthStep } from "@/store/authDialogStore";

const STEPS: AuthStep[] = ["mobile", "otp", "profile"];

const STEP_COPY: Record<AuthStep, string> = {
  mobile: "Log in to continue and access your cart, bookings and more.",
  otp: "We've sent a 6-digit code to your phone. Enter it to continue.",
  profile: "Almost there — a few details and you're ready to book.",
};

/**
 * The branded half of the auth sheet.
 *
 * Desktop only: on a phone the sheet is already narrow and every pixel of it
 * should be the form the patient came to fill, so this is hidden below `md`
 * rather than stacked above the fields.
 *
 * The dots are the three real steps, not decoration — the patient can see how
 * much is left, which is the difference between "one more screen" and an
 * open-ended form. Flat fills throughout, no gradients.
 */
function AuthBrandPanel({ step }: { step: AuthStep }) {
  // Not rendered at all below `md`, rather than hidden with CSS — on a phone
  // this panel has no job, so there is no reason to ship its markup and inline
  // SVG into the tree just to set `display: none` on it.
  const isDesktop = useIsDesktop();
  if (!isDesktop) return null;

  return (
    <div className="flex w-[15rem] shrink-0 flex-col items-center justify-between bg-accent/60 px-6 py-8 text-center lg:w-[17rem]">
      <div className="flex flex-col items-center">
        <img
          src={brandLogo}
          alt="Example Diagnostics Lab"
          className="h-9 w-auto object-contain"
        />

        <h3 className="mt-6 text-lg leading-snug font-bold text-foreground">
          Healthier Lives,
          <br />
          <span className="text-primary">Made Simpler</span>
        </h3>

        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{STEP_COPY[step]}</p>
      </div>

      <ShieldArt />

      <div className="flex items-center gap-2" aria-hidden>
        {STEPS.map((s) => (
          <span
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              s === step ? "w-6 bg-primary" : "w-1.5 bg-primary/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Inline rather than an asset: two flat brand colours and a handful of
 *  shapes, so it stays crisp at any size, follows the theme, and costs no
 *  extra request. */
function ShieldArt() {
  return (
    <svg
      viewBox="0 0 160 140"
      className="my-6 h-32 w-auto"
      role="presentation"
      aria-hidden
      fill="none"
    >
      <circle cx="80" cy="74" r="48" className="fill-primary/10" />
      <path
        d="M80 34l30 12v26c0 20-13 33-30 40-17-7-30-20-30-40V46l30-12z"
        className="fill-primary/85"
      />
      <rect x="68" y="72" width="24" height="20" rx="4" className="fill-card" />
      <path
        d="M73 72v-6a7 7 0 0114 0v6"
        className="stroke-card"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="80" cy="82" r="2.5" className="fill-primary" />
      <g className="fill-brand-green">
        <path d="M34 44h10v4H34z" />
        <path d="M37 41h4v10h-4z" />
        <path d="M120 96h10v4h-10z" />
        <path d="M123 93h4v10h-4z" />
      </g>
      <circle cx="126" cy="46" r="4" className="fill-brand-green/50" />
      <circle cx="36" cy="98" r="3" className="fill-primary/30" />
    </svg>
  );
}

export { AuthBrandPanel };
