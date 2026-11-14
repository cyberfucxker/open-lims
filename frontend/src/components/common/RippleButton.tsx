import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * Wraps the shared `Button` with a Material-style tap ripple. Kept as a
 * separate component (rather than editing button.tsx) so the base Button
 * used by Login stays untouched. When `asChild` is set, the ripple overlay
 * is skipped — Radix's `Slot` requires its child to be a single element, so
 * an extra overlay sibling would break `asChild` composition (e.g. `<Link>`).
 */
function RippleButton({ className, onClick, children, asChild, ...props }: ButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const ripple: Ripple = {
      id: Date.now(),
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
      size,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 650);
    onClick?.(event);
  };

  if (asChild) {
    return (
      <Button asChild className={className} onClick={onClick} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <Button className={cn("relative overflow-hidden", className)} onClick={handleClick} {...props}>
      {children}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ opacity: 0.35, scale: 0 }}
              animate={{ opacity: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="absolute rounded-full bg-white"
              style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
            />
          ))}
        </AnimatePresence>
      </span>
    </Button>
  );
}

export { RippleButton };
