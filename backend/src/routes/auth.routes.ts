import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authEmailRateLimiter, authRateLimiter } from "../middleware/rateLimit.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  otpLoginSchema,
  registerSchema,
  requestLoginOtpSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
  verifyEmailSchema,
} from "../validators/auth.validators";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
router.post(
  "/request-login-otp",
  authRateLimiter,
  validate({ body: requestLoginOtpSchema }),
  asyncHandler(authController.requestLoginOtp),
);
router.post(
  "/verify-login-otp",
  authRateLimiter,
  validate({ body: otpLoginSchema }),
  asyncHandler(authController.verifyOtpLogin),
);
router.post(
  "/login/otp",
  authRateLimiter,
  validate({ body: otpLoginSchema }),
  asyncHandler(authController.verifyOtpLogin),
);
router.post(
  "/send-verification-email",
  authEmailRateLimiter,
  validate({ body: sendVerificationEmailSchema }),
  asyncHandler(authController.sendVerificationEmail),
);
router.post(
  "/verify-email",
  authRateLimiter,
  validate({ body: verifyEmailSchema }),
  asyncHandler(authController.verifyEmail),
);
router.post(
  "/forgot-password",
  authEmailRateLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);
router.post(
  "/change-password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);
router.get("/me", requireAuth, asyncHandler(authController.me));

export default router;
