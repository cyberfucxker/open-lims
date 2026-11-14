import type { LucideIcon } from "lucide-react";
import { Briefcase, Check, Home, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { AddressResult } from "@/types";

const TYPE_ICON: Record<AddressResult["name"], LucideIcon> = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPin,
};

/** All address types share the brand gradient; the icon alone distinguishes
 *  Home / Work / Other, so the list stays scannable without introducing
 *  colours that compete with the primary. */
const TYPE_GRADIENT = "from-primary to-[oklch(0.5_0.22_20)]";

interface AddressCardProps {
  address: AddressResult;
  index?: number;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  settingDefault?: boolean;
}

function AddressCard({
  address,
  index = 0,
  selectMode = false,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  settingDefault = false,
}: AddressCardProps) {
  const Icon = TYPE_ICON[address.name] ?? MapPin;
  const gradient = TYPE_GRADIENT;

  // Street line: the typed fields first, then the map-derived address line —
  // flat, block and society are what actually get someone to the door, so
  // they lead; the geocoded line is the context around them.
  const streetLine = [address.house_no, address.block_no, address.apartment, address.address]
    .filter(Boolean)
    .join(", ");
  const regionLine = [
    address.locality,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      whileHover={selectMode ? { y: -2 } : undefined}
      role={selectMode ? "button" : undefined}
      tabIndex={selectMode ? 0 : undefined}
      aria-pressed={selectMode ? isSelected : undefined}
      onClick={selectMode ? onSelect : undefined}
      onKeyDown={
        selectMode
          ? (e) => {
              if (e.key === "Enter") onSelect?.();
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all",
        selectMode ? "cursor-pointer hover:shadow-lg" : "border-border/60",
        selectMode && !isSelected && "border-border/60 hover:border-primary/40",
        selectMode && isSelected && "border-primary ring-2 ring-primary/20 shadow-md",
      )}
    >
      {/* Left accent rail — always on for the chosen address, on hover otherwise. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-[oklch(0.5_0.22_20)] transition-opacity",
          selectMode && isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      />

      <div className="flex items-start gap-3">
        {selectMode && (
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              isSelected ? "border-primary bg-primary" : "border-input",
            )}
          >
            {isSelected && (
              <motion.span
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 420 }}
              >
                <Check className="size-3 text-white" strokeWidth={3} />
              </motion.span>
            )}
          </span>
        )}

        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            gradient,
          )}
        >
          <Icon className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold capitalize text-foreground">
              {address.name.toLowerCase()}
            </p>
            {address.is_default && (
              <Badge variant="secondary" className="text-[11px]">
                Default
              </Badge>
            )}
            {selectMode && isSelected && (
              <Badge className="bg-primary text-[11px] text-white hover:bg-primary">Selected</Badge>
            )}
          </div>

          <p className="mt-1 text-sm leading-relaxed text-foreground/80">{streetLine}</p>
          {regionLine && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{regionLine}</p>
          )}
          {address.phone && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3" />
              {address.phone}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        {!selectMode ? (
          <>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>

            {!address.is_default && (
              <Button variant="outline" size="sm" disabled={settingDefault} onClick={onSetDefault}>
                Set as default
              </Button>
            )}
          </>
        ) : (
          // No button here on purpose — the whole card is already the tap
          // target (see `onClick={selectMode ? onSelect : undefined}` above),
          // so this row is just a caption, not a second, redundant CTA.
          <p className="text-[11px] text-muted-foreground">
            Free home sample collection at this address
          </p>
        )}
      </div>
    </motion.div>
  );
}

export { AddressCard };
