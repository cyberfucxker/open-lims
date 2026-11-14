import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

/** "csv" is deliberately absent — there's no real "match an uploaded list
 *  against our AppUsers" lookup on the backend yet, so that audience type
 *  stays UI-only rather than silently sending to the wrong (or zero)
 *  people. See `notificationCampaign.service.ts` on the backend.
 *  `individual_phlebo` is the one audience that targets a phlebotomist
 *  instead of a customer. */
export type PushAudience =
  | { type: "all" }
  | { type: "filtered"; cityId?: string; minOrderCount?: number }
  | { type: "individual"; appUserId: string }
  | { type: "individual_phlebo"; phleboId: string };

export interface SendPushCampaignInput {
  audience: PushAudience;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushCampaignResult {
  totalMatched: number;
  withToken: number;
  sent: number;
  failed: number;
}

export async function sendPushCampaignApi(
  input: SendPushCampaignInput,
): Promise<SendPushCampaignResult> {
  const response = await httpClient.post<ApiResponseBody<SendPushCampaignResult>>(
    "/notifications/send-push",
    input,
  );
  return response.data.data as SendPushCampaignResult;
}
