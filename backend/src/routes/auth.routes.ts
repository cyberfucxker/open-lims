import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  changePasswordValidation,
  changeUsernameValidation,
  forgotPasswordValidation,
  loginValidation,
  logoutValidation,
  refreshTokenValidation,
  resetPasswordValidation,
} from "../validations/auth.validation";

const router = Router();

router.post("/login", authRateLimiter, loginValidation, validate, authController.login);

router.post(
  "/forgot-password",
  authRateLimiter,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  authRateLimiter,
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);

router.post(
  "/refresh-token",
  authRateLimiter,
  refreshTokenValidation,
  validate,
  authController.refreshToken,
);

// Rate-limited like the other credential-handling routes: it accepts the
// current password, so it is brute-forceable in exactly the way /login is.
router.post(
  "/change-password",
  authenticate,
  authRateLimiter,
  changePasswordValidation,
  validate,
  authController.changePassword,
);

// Same rate limit as /change-password: it also accepts the current password.
router.post(
  "/change-username",
  authenticate,
  authRateLimiter,
  changeUsernameValidation,
  validate,
  authController.changeUsername,
);

router.post("/logout", authenticate, logoutValidation, validate, authController.logout);

router.get("/me", authenticate, authController.me);

export { router as authRouter };
