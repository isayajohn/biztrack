import { Router } from "express";
import * as subscriptionController from "../controllers/subscription.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { subscriptionCheckoutSchema } from "../validators/subscription.validators";

const router = Router();

router.post("/azam-pay/callback", asyncHandler(subscriptionController.azamPayCallback));
router.get("/current", requireAuth, asyncHandler(subscriptionController.current));
router.post(
  "/checkout",
  requireAuth,
  validate({ body: subscriptionCheckoutSchema }),
  asyncHandler(subscriptionController.checkout),
);

export default router;
