import type { ReactNode } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";

import { cn } from "@/utils/cn";

interface PhoneFrameProps {
  children: ReactNode;
  statusBarClassName?: string;
  className?: string;
}

function PhoneFrame({ children, statusBarClassName, className }: PhoneFrameProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[300px]", className)}>
      <div className="rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-2xl dark:border-slate-700">
        <div className="relative overflow-hidden rounded-[2rem] bg-background">
          <div className="absolute top-2 left-1/2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-slate-900" />
          <div
            className={cn(
              "flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold",
              statusBarClassName,
            )}
          >
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <BatteryFull className="size-3.5" />
            </div>
          </div>
          <div className="h-[520px] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export { PhoneFrame };
