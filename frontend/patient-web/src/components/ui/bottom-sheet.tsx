import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** "dialog" (default) — the desktop behaviour every existing caller keeps:
   *  a width-capped card that scales in, centred in the viewport. "drawer" —
   *  opt-in for a longer form (Add Family Member, Add Address) where a
   *  centred modal reads as heavier than it needs to be on a wide screen;
   *  desktop instead gets a full-height panel that slides in from the right
   *  edge, mobile is unchanged either way (always the bottom sheet). */
  desktopVariant?: "dialog" | "drawer";
}

/** Native-app-style bottom sheet driven by Framer Motion spring physics rather than CSS
 *  keyframes — used for address/slot/filter/payment pickers where the slide-up feel matters.
 *  For simple side drawers without that requirement, use ui/sheet.tsx instead.
 *
 *  Responsive by design: below `md` it's a full-width sheet that springs up from
 *  the bottom edge; at `md` and above a full-bleed sheet looks broken on a wide
 *  screen, so it becomes a width-capped card centred in the viewport that scales
 *  in instead (`desktopVariant="dialog"`), or a right-edge sliding panel
 *  (`desktopVariant="drawer"`). Same component, same props otherwise — callers
 *  don't change. */
function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
  desktopVariant = "dialog",
}: BottomSheetProps) {
  const isDesktop = useIsDesktop();
  const isDrawer = desktopVariant === "drawer";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 md:bg-black/60 md:backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>

            {/* On desktop a flex wrapper centres the card; on mobile the content
                is pinned to the bottom edge by its own positioning. */}
            <div className="pointer-events-none fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-6">
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  className={cn(
                    "pointer-events-auto absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-5 shadow-2xl",
                    "pb-[calc(1.25rem+var(--safe-area-bottom))]",
                    isDrawer
                      ? "md:fixed md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-2xl md:border md:border-t-0 md:p-6 md:pb-6"
                      : "md:relative md:inset-auto md:w-full md:max-w-lg md:rounded-2xl md:border md:p-6 md:pb-6",
                    className,
                  )}
                  initial={
                    isDesktop
                      ? isDrawer
                        ? { x: "100%" }
                        : { opacity: 0, scale: 0.96, y: 8 }
                      : { y: "100%" }
                  }
                  animate={
                    isDesktop ? (isDrawer ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }) : { y: 0 }
                  }
                  exit={
                    isDesktop
                      ? isDrawer
                        ? { x: "100%" }
                        : { opacity: 0, scale: 0.96, y: 8 }
                      : { y: "100%" }
                  }
                  transition={
                    isDesktop && !isDrawer
                      ? { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
                      : { type: "spring", damping: 30, stiffness: 340 }
                  }
                >
                  {/* Drag affordance only reads as one on a bottom sheet. */}
                  <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border md:hidden" />
                  <DialogPrimitive.Title
                    className={title ? "mb-4 pr-8 text-base font-bold md:text-lg" : "sr-only"}
                  >
                    {title ?? "Sheet"}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close className="absolute top-5 right-5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:top-6 md:right-6">
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export { BottomSheet };
