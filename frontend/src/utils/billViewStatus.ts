import type { BillListItem } from "@/types/bill";

/** Mirrors the backend's derived Due/Paid/Free/Cancelled view (see
 *  `bill.repository.ts#applyViewFilter`) for display in the Bill List table —
 *  never a separately stored status. */
export function getBillViewStatus(
  bill: Pick<BillListItem, "status" | "netAmount" | "dueAmount">,
): string {
  if (bill.status === "CANCELLED") return "Cancelled";
  if (bill.netAmount === 0) return "Free";
  if (bill.dueAmount <= 0) return "Paid";
  return "Due";
}
