import { cn } from "@/utils/cn";

interface SectionDividerProps {
  /** Text-color utility class controlling the wave fill (uses currentColor). */
  toneClassName?: string;
  flip?: boolean;
  className?: string;
}

/** Decorative wave divider dropped between home-page sections to break up
 *  flat color bands — purely visual, renders behind section content. */
function SectionDivider({
  toneClassName = "text-background",
  flip = false,
  className,
}: SectionDividerProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative h-8 w-full overflow-hidden sm:h-12",
        toneClassName,
        className,
      )}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn("h-full w-full", flip && "rotate-180")}
      >
        <path
          fill="currentColor"
          d="M0,64 C240,120 480,0 720,32 C960,64 1200,112 1440,48 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}

export { SectionDivider };
