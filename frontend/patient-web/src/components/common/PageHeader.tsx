import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
  className?: string;
}

function PageHeader({ title, showBack = true, right, className }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-sm",
        className,
      )}
    >
      {showBack && (
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft className="size-5" />
        </Button>
      )}
      <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>
      {right}
    </div>
  );
}

export { PageHeader };
