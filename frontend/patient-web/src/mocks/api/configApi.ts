import { delay } from "../delay";
import { MOCK_CONFIG } from "../data/config";
import type { AppConfigResult } from "@/types";

export const configApi = {
  async getConfig(): Promise<AppConfigResult> {
    return delay(MOCK_CONFIG, 300);
  },
};
