import type { UserAppReview } from "@/lib/types";
import { customers } from "./customers";
import { phlebos } from "./phlebos";
import { daysAgoISO, pick, randBool, randInt } from "./generators";

const APP_COMMENTS = [
  "Sample collection was quick and the phlebo was very professional.",
  "Report delivery was delayed by almost a day, not happy about it.",
  "App is easy to use, booking took less than 2 minutes.",
  "Customer support resolved my payment issue quickly.",
  "Wish there were more slot options in the evening.",
  "Great experience overall, will book again.",
  "The phlebo arrived late without any notification.",
  "Loved the wallet cashback offer on recharge.",
];

const PHLEBO_COMMENTS = [
  "Very gentle during the blood draw, hardly felt a thing.",
  "Arrived exactly on time and was courteous.",
  "Took multiple attempts to draw the sample.",
  "Explained the process well and was patient with my elderly mother.",
  "Did not carry proper ID, had to verify separately.",
];

export const reviews: UserAppReview[] = Array.from({ length: 90 }, (_, i) => {
  const isAppReview = randBool(0.55);
  const customer = pick(customers);
  const rating = isAppReview ? randInt(2, 5) : randInt(3, 5);
  return {
    id: `review-${i + 1}`,
    customerName: customer.name,
    targetType: isAppReview ? "app" : "phlebo",
    targetName: isAppReview ? undefined : pick(phlebos).name,
    rating,
    comment: isAppReview ? pick(APP_COMMENTS) : pick(PHLEBO_COMMENTS),
    createdAt: daysAgoISO(randInt(0, 90)),
    flagged: rating <= 2,
  };
});
