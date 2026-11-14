import { useQuery } from "@tanstack/react-query";

import { fetchBranchUsers } from "@/services/api/branchUserApi";

/** Branch logins for the Test form's availability picker. Rarely changes, so it's
 *  fetched once and cached rather than re-queried per keystroke — the picker
 *  filters the loaded list client-side. */
export function useBranchUsers() {
  return useQuery({
    queryKey: ["branch-users"],
    queryFn: () => fetchBranchUsers(),
    placeholderData: (prev) => prev,
  });
}
