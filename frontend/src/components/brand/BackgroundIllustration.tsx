/**
 * Decorative, purely presentational background used behind the auth layout.
 * Combines a flat navy base and softly floating blue glows — no external
 * image assets required.
 */
function BackgroundIllustration() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-navy-950"
      aria-hidden="true"
    >
      {/* base fill */}
      <div className="absolute inset-0 bg-navy-900" />

      {/* floating glows */}
      <div className="animate-float absolute -top-24 -left-24 size-[420px] rounded-full bg-brand-blue/30 blur-3xl" />
      <div className="animate-float-slow absolute top-1/3 -right-32 size-[480px] rounded-full bg-brand-blue-light/20 blur-3xl" />
      <div className="animate-float absolute -bottom-32 left-1/4 size-[360px] rounded-full bg-navy-800/60 blur-3xl [animation-delay:2s]" />

      {/* edge overlay */}
      <div className="absolute inset-0 bg-navy-950/30" />
    </div>
  );
}

export { BackgroundIllustration };
