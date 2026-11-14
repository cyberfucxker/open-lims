import * as appUserRepository from "../repositories/appUser.repository";
import * as phlebotomistRepository from "../repositories/phlebotomist.repository";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { sendCustomNotification } from "./notification.service";

/** Mirrors the Superadmin Notifications page's "Audience" builder — "csv"
 *  (upload a list) is deliberately absent: there's no real "match an
 *  uploaded list against our AppUsers" lookup yet, so that audience type
 *  stays UI-only rather than silently sending to the wrong (or zero)
 *  people. `individual_phlebo` is the one audience that targets a
 *  `Phlebotomist` instead of an `AppUser` — everything else here is
 *  customer-only. */
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
  /** How many AppUsers matched the audience, token or not. */
  totalMatched: number;
  /** Of those, how many actually had a device token to send to. */
  withToken: number;
  sent: number;
  failed: number;
}

async function resolveTargets(
  audience: PushAudience,
): Promise<{ id: string; fcmToken: string | null }[]> {
  if (audience.type === "individual") {
    const appUser = await appUserRepository.findAppUserById(audience.appUserId);
    if (!appUser) {
      throw ApiError.notFound("Customer not found");
    }
    return [{ id: appUser.id, fcmToken: appUser.fcmToken }];
  }

  if (audience.type === "individual_phlebo") {
    const phlebotomist = await phlebotomistRepository.findPhlebotomistById(audience.phleboId);
    if (!phlebotomist) {
      throw ApiError.notFound("Phlebotomist not found");
    }
    return [{ id: phlebotomist.id, fcmToken: phlebotomist.fcmToken }];
  }

  if (audience.type === "filtered") {
    return appUserRepository.listAppUserPushTargets({
      cityId: audience.cityId,
      minOrderCount: audience.minOrderCount,
    });
  }

  return appUserRepository.listAppUserPushTargets({});
}

/**
 * Resolves a campaign's audience to real recipient rows — `AppUser`s for
 * every audience type except `individual_phlebo`, which targets a single
 * `Phlebotomist` instead — and sends a push to each one that has a device
 * token on file. The "Send Campaign" action behind the Superadmin
 * Notifications page's Push channel.
 *
 * Deliberately doesn't fail the whole request over individual send
 * failures (a bad/expired token on one device shouldn't block delivery to
 * everyone else); failures are aggregated into the result and logged with
 * their reasons for follow-up.
 */
export async function sendPushCampaign(
  input: SendPushCampaignInput,
): Promise<SendPushCampaignResult> {
  if (input.audience.type === "individual" && !input.audience.appUserId) {
    throw ApiError.badRequest("appUserId is required for an individual audience");
  }
  if (input.audience.type === "individual_phlebo" && !input.audience.phleboId) {
    throw ApiError.badRequest("phleboId is required for an individual_phlebo audience");
  }

  const targets = await resolveTargets(input.audience);
  const withTokens = targets.filter((t): t is { id: string; fcmToken: string } => !!t.fcmToken);

  const outcomes = await Promise.all(
    withTokens.map((target) =>
      sendCustomNotification({
        token: target.fcmToken,
        title: input.title,
        body: input.body,
        data: input.data,
      }).then((result) => ({ appUserId: target.id, ...result })),
    ),
  );

  const failures = outcomes.filter((o) => !o.success);
  if (failures.length > 0) {
    logger.warn("Push campaign had send failures", {
      failedCount: failures.length,
      sample: failures.slice(0, 5),
    });
  }

  return {
    totalMatched: targets.length,
    withToken: withTokens.length,
    sent: outcomes.length - failures.length,
    failed: failures.length,
  };
}
