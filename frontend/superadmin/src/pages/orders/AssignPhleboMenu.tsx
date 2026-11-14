import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignPhlebo } from "@/hooks/queries/useAppOrders";
import { usePhlebotomists } from "@/hooks/queries/usePhlebotomists";
import type { AppOrderListItem } from "@/services/api/appOrderApi";

interface AssignPhleboMenuProps {
  order: AppOrderListItem;
}

function AssignPhleboMenu({ order }: AssignPhleboMenuProps) {
  const { data: phlebos = [] } = usePhlebotomists();
  const assignPhlebo = useAssignPhlebo();

  function handleReassign(value: string) {
    const phleboId = value === "unassigned" ? null : value;
    assignPhlebo.mutate(
      { orderId: order.id, phleboId },
      {
        onSuccess: () => {
          const phlebo = phlebos.find((p) => p.id === phleboId);
          toast.success(
            phlebo
              ? `${order.orderNumber} reassigned to ${phlebo.name}`
              : `${order.orderNumber} marked unassigned`,
          );
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to reassign phlebo");
        },
      },
    );
  }

  return (
    <Select
      value={order.phlebotomist?.id ?? "unassigned"}
      onValueChange={handleReassign}
      disabled={assignPhlebo.isPending}
    >
      <SelectTrigger
        className="h-9 w-[170px] text-xs"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Reassign phlebo for order ${order.orderNumber}`}
      >
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {phlebos.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { AssignPhleboMenu };
