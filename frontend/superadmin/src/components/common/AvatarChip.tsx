import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

interface AvatarChipProps {
  name: string | null;
  color?: string;
  subtitle?: string;
  size?: "sm" | "md";
}

function AvatarChip({ name, color = "var(--primary)", subtitle, size = "sm" }: AvatarChipProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className={size === "sm" ? "size-8" : "size-10"}>
        <AvatarFallback
          style={{ backgroundColor: color }}
          className="text-xs font-semibold text-white"
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-medium text-foreground">{name || "Unnamed"}</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}

export { AvatarChip };
