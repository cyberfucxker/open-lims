import { delay } from "../delay";
import { MOCK_CENTERS, MOCK_CENTER_DETAILS } from "../data/centers";
import type { CenterDetail, CenterListItem } from "@/types";

export const centerApi = {
  async list(): Promise<CenterListItem[]> {
    return delay([...MOCK_CENTERS]);
  },

  async getById(id: string): Promise<CenterDetail | null> {
    return delay(MOCK_CENTER_DETAILS[id] ?? null);
  },
};
