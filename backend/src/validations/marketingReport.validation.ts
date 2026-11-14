import { query } from "express-validator";

export const monthlyReportValidation = [
  query("month").isInt({ min: 1, max: 12 }).withMessage("month must be between 1 and 12").toInt(),
  query("year").isInt({ min: 2000, max: 2100 }).withMessage("Enter a valid year").toInt(),
];

export const leaderboardValidation = [
  ...monthlyReportValidation,
  query("rankBy")
    .optional()
    .isIn(["revenueAchieved", "achievementPercent", "commissionAmount"])
    .withMessage("Invalid rankBy value"),
];
